import type { Actions, ListenerArgsMap, Message } from "./types";

type ListenerPayload = {
	[K in keyof ListenerArgsMap]: {
		type: "listener";
		name: K;
		args: ListenerArgsMap[K];
	};
}[keyof ListenerArgsMap];

interface SuccessPayload {
	type: "success";
	result: ReturnType<Actions[keyof Actions]>;
}

interface ErrorPayload {
	type: "error";
	error: unknown;
}

type Payload = ListenerPayload | SuccessPayload | ErrorPayload;

type Listeners = { [K in keyof ListenerArgsMap]: (...args: ListenerArgsMap[K]) => void };

let running: Message | null = null;
const queue: Message[] = [];

const listeners = {} as { [K in keyof Listeners]?: Set<Listeners[K]> };

// Prevent automatic elimination
// eslint-disable-next-line no-useless-concat
const enableLogging = typeof process === "object" && process[("env" + "") as "env"].NODE_ENV !== "production";

declare const workerSource: string;

let worker: Worker | undefined;

export async function initialize(pathToRimeJS: string | URL, pathToRimeWASM: string | URL) {
	if (worker) return;
	// Don’t use data URI as CSP may be set to reject it
	worker = new Worker(URL.createObjectURL(new Blob([workerSource.replace(/enableLogging/g, JSON.stringify(enableLogging))], { type: "text/javascript" })));
	worker.addEventListener("message", ({ data }: MessageEvent<Payload>) => {
		if (enableLogging) console.log("receive", data);
		const { type } = data;
		if (type === "listener") {
			const { name, args } = data;
			if (name in listeners) {
				for (const listener of listeners[name]!) {
					listener(...args);
				}
			}
		}
		else if (running) {
			const { resolve, reject } = running;
			const nextMessage = queue.shift();
			if (nextMessage) {
				postMessage(nextMessage);
			}
			else {
				running = null;
			}
			if (type === "success") {
				resolve(data.result);
			}
			else {
				reject(data.error);
			}
		}
	});
	let baseURL: string;
	try {
		baseURL = import.meta.url;
	}
	catch {
		baseURL = (document.currentScript as HTMLScriptElement | null)?.src || location.href;
	}
	return actions.initialize(baseURL, pathToRimeJS, pathToRimeWASM);
}

function postMessage(message: Message) {
	if (enableLogging) console.log("post", message);
	const { name, args } = running = message;
	worker!.postMessage({ name, args });
}

const actions = new Proxy({} as Actions, {
	get<K extends keyof Actions>(_: Actions, name: K) {
		return (...args: Parameters<Actions[K]>) =>
			new Promise((resolve, reject) => {
				const message: Message = { name, args, resolve, reject };
				if (!worker || running) {
					queue.push(message);
				}
				else {
					postMessage(message);
				}
			});
	},
});

export const {
	setSchemaFiles,
	processKey,
	selectCandidate,
	deleteCandidate,
	flipPage,
	clearInput,
	deploy,
} = actions;

export function subscribe<K extends keyof Listeners>(type: K, callback: Listeners[K]) {
	(listeners[type] ||= new Set()).add(callback);
	return () => {
		if (listeners[type]) {
			listeners[type].delete(callback);
			if (!listeners[type].size) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete listeners[type];
			}
		}
	};
}

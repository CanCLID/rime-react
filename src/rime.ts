import type { Actions, ListenerArgsMap, Message, RimeDeployStatus, RimeInputStatus } from "./types";

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

type Listeners = {
	deployStatusChanged: (status: RimeDeployStatus) => void;
	inputStatusChanged: (status: RimeInputStatus) => void;
};

let running: Message | null = null;
const queue: Message[] = [];

const listeners: { [K in keyof Listeners]: Set<Listeners[K]> } = {
	deployStatusChanged: new Set(),
	inputStatusChanged: new Set(),
};

let enableLogging = false;
try {
	// We have to do this way since `typeof process === "object"` isn’t transformed by bundler like vite.
	// The concatenation prevents automatic elimination during library bundling and transforms to
	// `process.env.NODE_ENV` in the output.
	// eslint-disable-next-line no-useless-concat
	enableLogging = process[("env" + "") as "env"]["NODE_ENV"] !== "production";
}
catch {
	// The module is running in an environment where `process` is not defined, such as in a browser.
}

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
			if (data.name === "deployStatusChanged") {
				for (const listener of listeners.deployStatusChanged) {
					listener(...data.args);
				}
			}
			else if (data.name === "inputStatusChanged") {
				for (const listener of listeners.inputStatusChanged) {
					listener(...data.args);
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

export function subscribe(type: "deployStatusChanged", callback: Listeners["deployStatusChanged"]): () => void;
export function subscribe(type: "inputStatusChanged", callback: Listeners["inputStatusChanged"]): () => void;
export function subscribe(type: keyof Listeners, callback: Listeners[keyof Listeners]) {
	const set = listeners[type] as Set<Listeners[keyof Listeners]>;
	set.add(callback);
	return () => {
		set.delete(callback);
	};
}

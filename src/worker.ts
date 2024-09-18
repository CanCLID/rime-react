import { openDB } from "idb";

import type { Actions, ListenerArgsMap, Message, RimeResult, RimeAPI, RimeNotification } from "./types";
import type { DBSchema, IDBPDatabase } from "idb";

type TypeToString<T> = T extends number ? "number"
	: T extends string ? "string"
	: T extends readonly unknown[] ? "array"
	: T extends boolean ? "boolean"
	: null;

type ArgsToString<T> = { [P in keyof T]: TypeToString<T[P]> };

interface Module {
	ccall<Method extends keyof RimeAPI>(
		ident: Method,
		returnType: TypeToString<ReturnType<RimeAPI[Method]>>,
		argTypes: ArgsToString<Parameters<RimeAPI[Method]>>,
		args: Parameters<RimeAPI[Method]>,
		opts?: Emscripten.CCallOpts,
	): ReturnType<RimeAPI[Method]>;
	FS: typeof FS;
}

declare const Module: Module;

interface PredefinedModule {
	print(message: string): void;
	printErr(message: string): void;
	onRuntimeInitialized(): void;
	locateFile(path: string, prefix: string): string;
}

declare const globalThis: {
	onRimeNotification<T extends keyof RimeNotification>(type: T, value: RimeNotification[T]): void;
	Module: PredefinedModule;
};

globalThis.onRimeNotification = (type, value) => {
	switch (type) {
		case "deploy":
			dispatch("deployStatusChanged", value);
			break;
	}
};

function dispatch<K extends keyof ListenerArgsMap>(name: K, ...args: ListenerArgsMap[K]) {
	postMessage({ type: "listener", name, args });
}

function syncUserDirectory(direction: "read" | "write") {
	return new Promise<void>((resolve, reject) => {
		Module.FS.syncfs(direction === "read", (err?: Error) => err ? reject(err) : resolve());
	});
}

declare const enableLogging: boolean;
function log(defaultSeverity: "info" | "error") {
	return (message: string) => {
		if (enableLogging) {
			const match = /^([IWEF])\d+ \S+ \d+ (.*)$/.exec(message);
			if (match) {
				console[({ I: "info", W: "warn", E: "error", F: "error" } as const)[match[1] as "I" | "W" | "E" | "F"]](`[${match[2]}`);
			}
			else {
				console[defaultSeverity](message);
			}
		}
	};
}

const RIME_USER_DIR = "/rime";
const RIME_SHARED_DIR = "/usr/share/rime-data";

const DB_HASH = "shared-dir-files-hash";
const DB_CONTENT = "shared-dir-files-content";

interface Database extends DBSchema {
	[DB_HASH]: {
		key: string;
		value: {
			file: string;
			hash: string;
		};
	};
	[DB_CONTENT]: {
		key: string;
		value: ArrayBuffer;
	};
}

let cacheDB: IDBPDatabase<Database> | undefined;
let pendingCacheDB: Promise<IDBPDatabase<Database>> | undefined = openDB("rime-react-schema", 1, {
	upgrade(db) {
		if (!db.objectStoreNames.contains(DB_HASH)) {
			db.createObjectStore(DB_HASH);
		}
		if (!db.objectStoreNames.contains(DB_CONTENT)) {
			db.createObjectStore(DB_CONTENT);
		}
	},
});

function normalizeURL(...parts: string[]) {
	const newSegments = [];
	for (const segments of parts) {
		for (const segment of segments.replace(/^\.[/\\]|[/\\]\.$/g, "/").split(/[/\\]/)) {
			if (segment === ".." && newSegments.length) newSegments.pop();
			else if (segment !== ".") newSegments.push(segment);
		}
	}
	return newSegments.join("/") || ".";
}

let userDirMounted = false;
let initialized = false;
const actions: Actions = {
	initialize(pathToRimeJS, pathToRimeWASM) {
		return new Promise<void>(resolve => {
			globalThis.Module = {
				print: log("info"),
				printErr: log("error"),
				onRuntimeInitialized: resolve,
				locateFile: () => pathToRimeWASM,
			};
			importScripts(pathToRimeJS);
		});
	},
	async setSchemaFiles(prefix, schemaFiles) {
		if (pendingCacheDB) {
			cacheDB = await pendingCacheDB;
			pendingCacheDB = undefined;
		}
		if (cacheDB) {
			await Promise.all(
				(await cacheDB.getAll(DB_HASH)).flatMap(({ file, hash }) => {
					if (schemaFiles[file] !== hash) {
						Module.FS.unlink(`${RIME_SHARED_DIR}/${file}`);
						return [
							cacheDB!.delete(DB_HASH, file),
							cacheDB!.delete(DB_CONTENT, file),
						];
					}
					return [];
				}),
			);
		}
		prefix = normalizeURL(prefix);
		await Promise.all(
			Object.entries(schemaFiles).map(async ([file, hash]) => {
				file = normalizeURL(file);
				const cachedFile = await cacheDB?.get(DB_HASH, file);
				if (cachedFile?.hash === hash) {
					return cacheDB?.get(DB_CONTENT, file);
				}
				const fetchPath = normalizeURL(prefix.replace(/\/$/, ""), file.replace(/^\//, ""));
				const response = await fetch(fetchPath, { cache: "no-cache" });
				if (!response.ok) {
					throw new Error(`Failed to download ${fetchPath}`);
				}
				const buffer = await response.arrayBuffer();
				if (
					hash !== Array.from(
						new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
						byte => byte.toString(16).padStart(2, "0"),
					).join("")
				) throw new Error(`Error downloading ${fetchPath}: incorrect hash`);
				await cacheDB?.put(DB_CONTENT, buffer, file);
				await cacheDB?.put(DB_HASH, { file, hash }, file);
				Module.FS.writeFile(`${RIME_SHARED_DIR}/${file}`, new Uint8Array(buffer));
				return buffer;
			}),
		);
		if (!userDirMounted) {
			Module.FS.mkdir(RIME_USER_DIR);
			Module.FS.mount(IDBFS, {}, RIME_USER_DIR);
			userDirMounted = true;
		}
		await syncUserDirectory("read");
		const success = Module.ccall(initialized ? "deploy" : "init", "boolean", [], []);
		await syncUserDirectory("write");
		return initialized = success;
	},
	async processKey(input) {
		const result = JSON.parse(Module.ccall("process_key", "string", ["string"], [input])) as RimeResult;
		if ("committed" in result) {
			await syncUserDirectory("write");
		}
		return result;
	},
	async selectCandidate(index) {
		return JSON.parse(Module.ccall("select_candidate", "string", ["number"], [index])) as RimeResult;
	},
	async deleteCandidate(index) {
		return JSON.parse(Module.ccall("delete_candidate", "string", ["number"], [index])) as RimeResult;
	},
	async flipPage(backward) {
		return JSON.parse(Module.ccall("flip_page", "string", ["boolean"], [backward])) as RimeResult;
	},
	async clearInput() {
		return JSON.parse(Module.ccall("clear_input", "string", [], [])) as RimeResult;
	},
	async deploy() {
		const result = Module.ccall("deploy", "boolean", [], []);
		await syncUserDirectory("write");
		return result;
	},
};

addEventListener("message", async ({ data: { name, args } }: MessageEvent<Message>) => {
	try {
		// @ts-expect-error Unactionable
		const result = await actions[name](...args);
		postMessage({ type: "success", result });
	}
	catch (error) {
		postMessage({ type: "error", error });
	}
});

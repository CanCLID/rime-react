import { openDB } from "idb";

import type { Actions, ListenerArgsMap, Message, RimeResult, RimeAPI, RimeNotification } from "./types";
import type { DBSchema, IDBPDatabase } from "idb";

type TypeToString<T> = T extends number ? "number"
	: T extends string ? "string"
	: T extends readonly unknown[] ? "array"
	: T extends boolean ? "boolean"
	: null;

type ArgsToString<T> = { [P in keyof T]: TypeToString<T[P]> };

declare const Module: {
	ccall<Method extends keyof RimeAPI>(
		ident: Method,
		returnType: TypeToString<ReturnType<RimeAPI[Method]>>,
		argTypes: ArgsToString<Parameters<RimeAPI[Method]>>,
		args: Parameters<RimeAPI[Method]>,
		opts?: Emscripten.CCallOpts,
	): ReturnType<RimeAPI[Method]>;
	FS: typeof FS & {
		mkdirTree(path: string, mode?: number): void;
	};
};
declare const PATH: {
	normalize(path: string): string;
};

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
			const removeResults = await Promise.allSettled(
				(await cacheDB.getAll(DB_HASH)).flatMap(({ file, hash }) => {
					if (schemaFiles[file] !== hash) {
						const filePath = PATH.normalize(`${RIME_SHARED_DIR}/${file}`);
						if (Module.FS.analyzePath(filePath).exists) {
							Module.FS.unlink(filePath);
						}
						return [
							cacheDB!.delete(DB_HASH, file),
							cacheDB!.delete(DB_CONTENT, file),
						];
					}
					return [];
				}),
			);
			const failedRemovals = removeResults.filter(result => result.status === "rejected");
			if (failedRemovals.length) {
				throw new AggregateError(failedRemovals.map(result => result.reason as Error), "Failed to completely remove stale schema files");
			}
		}
		prefix = normalizeURL(prefix).replace(/\/$/, "");
		const fetchResults = await Promise.allSettled(
			Object.entries(schemaFiles).map(async ([file, hash]) => {
				const fetchPath = normalizeURL(prefix, normalizeURL(file).replace(/^\//, ""));
				file = file.replace(/[?#].*/, ""); // Remove query and fragment if any
				file = PATH.normalize(file).replace(/^\/|\/$/g, "");
				const cachedFile = await cacheDB?.get(DB_HASH, file);
				const savePath = PATH.normalize(`${RIME_SHARED_DIR}/${file}`);
				let buffer: ArrayBuffer | undefined;
				if (cachedFile?.hash === hash) {
					buffer = await cacheDB?.get(DB_CONTENT, file);
					if (buffer && Module.FS.analyzePath(savePath).exists) {
						// Saved files with different hashes from those in the database are already deleted above,
						// So the file here must be the same as the one in the database
						return buffer;
					}
				}
				if (!buffer) {
					const response = await fetch(fetchPath, { cache: "no-cache" });
					if (!response.ok) {
						throw new Error(`Failed to download ${fetchPath}`);
					}
					buffer = await response.arrayBuffer();
					const actualHash = Array.from(
						new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
						byte => byte.toString(16).padStart(2, "0"),
					).join("");
					if (hash !== actualHash) {
						throw new Error(`Error downloading ${fetchPath}: expected SHA-256 hash ${hash}, got ${actualHash}`);
					}
					await cacheDB?.put(DB_CONTENT, buffer, file);
					await cacheDB?.put(DB_HASH, { file, hash }, file);
				}
				Module.FS.mkdirTree(savePath.slice(0, savePath.lastIndexOf("/")));
				Module.FS.writeFile(savePath, new Uint8Array(buffer));
				return buffer;
			}),
		);
		if (!userDirMounted) {
			Module.FS.mkdir(RIME_USER_DIR);
			Module.FS.mount(IDBFS, {}, RIME_USER_DIR);
			userDirMounted = true;
		}
		await syncUserDirectory("read");
		const success = initialized = Module.ccall(initialized ? "deploy" : "init", "boolean", [], []);
		await syncUserDirectory("write");
		const failedFetches = fetchResults.filter(result => result.status === "rejected");
		if (failedFetches.length) {
			throw new AggregateError(failedFetches.map(result => result.reason as Error), "Failed to completely set schema files");
		}
		return success;
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

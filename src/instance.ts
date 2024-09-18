import type { RimeInstance } from "./types";

export let rimeInstance: RimeInstance | undefined;
export let pendingRimeInstance: Promise<RimeInstance> | undefined;

async function createRimeInstance() {
	try {
		return rimeInstance = await import("./rime");
	}
	finally {
		pendingRimeInstance = undefined;
	}
}

export default function getRimeInstance() {
	return rimeInstance || (pendingRimeInstance ||= createRimeInstance());
}

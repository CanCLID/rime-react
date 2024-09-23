import { useCallback } from "react";

import { useSet } from "react-use";

import type { RunAsyncTask } from "../types";

export default function useLoading(onError?: (error: unknown) => void): [boolean, RunAsyncTask, () => PromiseWithResolvers<void>] {
	const [promises, { add, remove }] = useSet<Promise<void>>();

	const runAsyncTask: RunAsyncTask = useCallback(asyncTask => {
		async function processAsyncTask() {
			try {
				await asyncTask();
			}
			catch (error) {
				onError?.(error);
			}
			finally {
				remove(promise);
			}
		}
		const promise = processAsyncTask();
		add(promise);
	}, [onError, add, remove]);

	const startAsyncTask = useCallback(() => {
		let resolve!: () => void;
		let reject!: (reason?: unknown) => void;
		const promise = new Promise<void>((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});
		runAsyncTask(() => promise);
		return { promise, resolve, reject };
	}, [runAsyncTask]);

	return [!!promises.size, runAsyncTask, startAsyncTask];
}

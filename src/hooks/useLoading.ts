import { useCallback } from "react";

import { useSet } from "react-use";

export default function useLoading(onError?: (error: unknown) => void): [boolean, (asyncTask: () => Promise<void>) => void, () => PromiseWithResolvers<void>] {
	const [promises, { add, remove }] = useSet<Promise<void>>();

	const runAsyncTask = useCallback((asyncTask: () => Promise<void>) => {
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

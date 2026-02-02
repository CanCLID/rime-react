import { useEffect } from "react";

import useLocalStorageState from "use-local-storage-state";

import useRimeInstance from "./useRimeInstance";

import type { RimePreferences, RunAsyncTask } from "../types";
import type { Dispatch, SetStateAction } from "react";

export default function useRimePreference(preference: keyof RimePreferences, runAsyncTask: RunAsyncTask): [number, Dispatch<SetStateAction<number>>] {
	const Rime = useRimeInstance();
	const storageKey = `rime-react/preferences/${preference}`;
	const [value, setValue] = useLocalStorageState(storageKey, { defaultValue: -1 });

	useEffect(() =>
		runAsyncTask(async () => {
			try {
				if (!(await Rime.setPreference(preference, value))) {
					throw new Error("Error occurred in RIME engine");
				}
			}
			catch (error) {
				throw new Error(`Failed to apply preference '${preference}'`, { cause: error });
			}
		}), [runAsyncTask, Rime, preference, value]);

	return [value, setValue];
}

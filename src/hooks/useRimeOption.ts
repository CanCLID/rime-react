import { useCallback, useEffect } from "react";

import useLocalStorageState from "use-local-storage-state";

import useRimeInstance from "./useRimeInstance";

import type { RunAsyncTask } from "../types";
import type { DispatchWithoutAction } from "react";

export default function useRimeOption(option: string, defaultValue: boolean, localStorageKey: string, runAsyncTask: RunAsyncTask): [boolean, DispatchWithoutAction] {
	const Rime = useRimeInstance();
	// XXX option should be under "rime-react/options", defaultValue is wrong
	const [value, setValue] = useLocalStorageState(localStorageKey, { defaultValue });

	const setOption = useCallback(() =>
		runAsyncTask(async () => {
			try {
				await Rime.setOption(option, +value);
			}
			catch (error) {
				throw new Error(`Failed to apply option '${option}'`, { cause: error });
			}
		}), [runAsyncTask, Rime, option, value]);

	useEffect(() =>
		Rime.subscribe("deployStatusChanged", status => {
			if (status === "success") setOption();
		}), [Rime, setOption]);

	useEffect(setOption, [setOption]);

	useEffect(() =>
		Rime.subscribe("optionChanged", (rimeOption, rimeValue) => {
			if (rimeOption === option) {
				setValue(rimeValue);
			}
		}), [Rime, option, setValue]);

	return [value, useCallback(() => setValue(value => !value), [setValue])];
}

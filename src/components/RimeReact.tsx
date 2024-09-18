import { useEffect, useRef, useState } from "react";

import CandidatePanel from "./CandidatePanel";
import useLoading from "../hooks/useLoading";
import getRimeInstance from "../instance";
import RimeContext from "../RimeContext";

import type { RimeInstance } from "../types";

export default function RimeReact({
	pathToRimeJS = "rime.js",
	pathToRimeWASM = "rime.wasm",
	schemaFilesFetchPrefix,
	schemaFilesToSHA256,
	includeElements = "input[type='text'], input[type='search'], textarea, [contenteditable]",
	onError,
	children,
}: {
	/** @default "rime.js" */
	pathToRimeJS?: string;
	/** @default "rime.wasm" */
	pathToRimeWASM?: string;
	schemaFilesFetchPrefix: string;
	schemaFilesToSHA256: Record<string, string>;
	/** @default "input[type='text'], input[type='search'], textarea, [contenteditable]" */
	includeElements?: string;
	onError?(error: unknown): void;
	children: JSX.Element;
}) {
	const [rimeInstance, setRimeInstance] = useState<RimeInstance | null>(null);
	const [isLoading, runAsyncTask, startAsyncTask] = useLoading(onError);

	const [isInitialized, setIsInitialized] = useState(false);
	const [isDeploying, setIsDeploying] = useState(false);

	useEffect(() => {
		runAsyncTask(async () => {
			const Rime = await getRimeInstance();
			await Rime.initialize(pathToRimeJS, pathToRimeWASM);
			setRimeInstance(Rime);
		});
	}, [runAsyncTask, pathToRimeJS, pathToRimeWASM]);

	useEffect(() => {
		if (!rimeInstance) return;
		runAsyncTask(async () => {
			if (await rimeInstance.setSchemaFiles(schemaFilesFetchPrefix, schemaFilesToSHA256)) {
				setIsInitialized(true);
			}
			else {
				throw new Error("Failed to initialize RIME engine");
			}
		});
	}, [runAsyncTask, rimeInstance, schemaFilesFetchPrefix, schemaFilesToSHA256]);

	useEffect(() => {
		if (!rimeInstance) return;
		let resolve!: () => void;
		let reject!: (reason?: unknown) => void;
		return rimeInstance.subscribe("deployStatusChanged", status => {
			switch (status) {
				case "start":
					({ resolve, reject } = startAsyncTask());
					setIsDeploying(true);
					break;
				case "success":
					setIsDeploying(false);
					resolve();
					break;
				case "failure":
					setIsDeploying(false);
					reject(new Error("Failed to deploy"));
					break;
			}
		});
	}, [startAsyncTask, rimeInstance]);

	const container = useRef<HTMLDivElement>(null);
	return <RimeContext.Provider
		value={{
			isLoading,
			isInitialized,
			isDeploying,
			subscribe: rimeInstance?.subscribe || (() => () => void 0), // XXX Fix Me
		}}>
		<div ref={container}>{children}</div>
		{rimeInstance && container.current
			&& <CandidatePanel
				rimeInstance={rimeInstance}
				container={container.current}
				includeElements={includeElements}
				runAsyncTask={runAsyncTask} />}
	</RimeContext.Provider>;
}

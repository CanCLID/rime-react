import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

import Candidate from "./Candidate";
import CandidateWrapper from "./CandidateWrapper";
import { ordinalSuffixes, RIME_KEY_MAP } from "../consts";
import useSelection from "../hooks/useSelection";
import { isPrintable } from "../utils";

import type { RimeInstance, InputState, RimeResult } from "../types";

export default function CandidatePanel({
	rimeInstance: Rime,
	container,
	includeElements,
	runAsyncTask,
}: {
	rimeInstance: RimeInstance;
	container: HTMLElement;
	includeElements: string;
	runAsyncTask(asyncTask: () => Promise<void>): void;
}) {
	const { caretPos, replaceSelection } = useSelection(container, includeElements);
	const [inputState, setInputState] = useState<InputState | null>(null);

	const handleRimeResult = useCallback((promise: Promise<RimeResult>, action: string, key?: string) =>
		runAsyncTask(async () => {
			try {
				const result = await promise;
				if (!result.success) {
					throw new Error("Error occurred in RIME engine");
				}
				setInputState(prevInputState => {
					const state = result.isComposing
						? {
							inputBuffer: result.inputBuffer,
							highlightedIndex: result.highlightedIndex,
							candidates: result.candidates,
							isPrevDisabled: !result.page,
							isNextDisabled: result.isLastPage,
						}
						: prevInputState;
					if (result.committed) {
						replaceSelection?.(result.committed);
					}
					else if (!state && key && isPrintable(key)) {
						replaceSelection?.(key);
					}
					return result.isComposing ? state : null;
				});
			}
			catch (error) {
				throw new Error(`Failed to ${action}`, { cause: error });
			}
		}), [runAsyncTask, replaceSelection]);

	const processKey = useCallback((input: string, key?: string) => handleRimeResult(Rime.processKey(input), `handle keyboard input '${input}'`, key), [handleRimeResult, Rime]);
	const flipPage = useCallback((backward: boolean) => handleRimeResult(Rime.flipPage(backward), `flip to the ${backward ? "previous" : "next"} candidate page`), [handleRimeResult, Rime]);
	const selectCandidate = useCallback((index: number) => handleRimeResult(Rime.selectCandidate(index), `select the ${index}${ordinalSuffixes[index] || "th"} candidate on the current page`), [handleRimeResult, Rime]);
	const deleteCandidate = useCallback((index: number) => handleRimeResult(Rime.deleteCandidate(index), `delete the ${index}${ordinalSuffixes[index] || "th"} candidate on the current page`), [handleRimeResult, Rime]);
	const clearInput = useCallback(() => handleRimeResult(Rime.clearInput(), "clear the current input buffer"), [handleRimeResult, Rime]);

	const parseKey = useCallback((event: KeyboardEvent) => {
		const { code, key } = event;
		const hasControl = event.getModifierState("Control");
		const hasMeta = event.getModifierState("Meta");
		const hasAlt = event.getModifierState("Alt");
		const hasShift = event.getModifierState("Shift");
		if (
			(inputState || (
				caretPos
				&& (!hasControl && (isPrintable(key) || !hasShift && key === "F4") || key === "`")
				&& !hasMeta
				&& !hasAlt
			)) && code
		) {
			const match = /^(Control|Meta|Alt|Shift)(Left|Right)$/.exec(code);
			const isNumpadKey = code.startsWith("Numpad");
			const modifiers = new Set<string>();
			if (hasControl) {
				modifiers.add("Control");
			}
			if (hasMeta) {
				modifiers.add("Meta");
			}
			if (hasAlt) {
				modifiers.add("Alt");
			}
			if (hasShift) {
				modifiers.add("Shift");
			}
			if (match) {
				modifiers.delete(match[1]);
				modifiers.add(`${match[1]}_${match[2][0]}`);
			}
			else {
				let rimeKey = isNumpadKey ? code.slice(6) : key;
				rimeKey = RIME_KEY_MAP[rimeKey] || rimeKey;
				modifiers.add(isNumpadKey ? `KP_${rimeKey}` : rimeKey);
			}
			return [...modifiers].join("+");
		}
		return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inputState, !caretPos]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const key = parseKey(event);
			if (key) {
				event.preventDefault();
				processKey(`{${key}}`, event.key);
			}
		}
		function onKeyUp(event: KeyboardEvent) {
			if (inputState) {
				const key = parseKey(event);
				if (key) processKey(`{Release+${key}}`);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("keyup", onKeyUp);
		};
	}, [inputState, parseKey, processKey]);

	useEffect(() => {
		document.addEventListener("selectionchange", clearInput);
		return () => {
			document.removeEventListener("selectionchange", clearInput);
		};
	}, [clearInput]);

	useEffect(() =>
		Rime.subscribe("deployStatusChanged", status => {
			if (status === "start") clearInput();
		}), [Rime, clearInput]);

	return caretPos && inputState && createPortal(
		<CandidateWrapper caretPos={caretPos}>
			<div id="input-buffer-row">
				<div id="input-buffer">
					{inputState.inputBuffer.before && <span id="input-buffer-before">{inputState.inputBuffer.before}</span>}
					{inputState.inputBuffer.active && <span id="input-buffer-active">{inputState.inputBuffer.active}</span>}
					{inputState.inputBuffer.after && <span id="input-buffer-after">{inputState.inputBuffer.after}</span>}
				</div>
				<div id="page-nav">
					<button disabled={inputState.isPrevDisabled} onClick={() => flipPage(true)}>
						<span>‹</span>
					</button>
					<button disabled={inputState.isNextDisabled} onClick={() => flipPage(false)}>
						<span>›</span>
					</button>
				</div>
			</div>
			<ol id="candidate-list">
				{inputState.candidates.map((candidate, index) =>
					<Candidate
						key={index}
						candidate={candidate}
						isHighlighted={index === inputState.highlightedIndex}
						selectCandidate={() => selectCandidate(index)}
						deleteCandidate={() => deleteCandidate(index)} />
				)}
			</ol>
		</CandidateWrapper>,
		document.body,
	);
}

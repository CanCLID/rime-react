import { useState, useLayoutEffect } from "react";

import getCaretCoordinates from "textarea-caret";

import { manageEventListeners } from "../utils";

import type { SelectionState, CaretPos } from "../types";

export default function useSelection(container: HTMLElement, includeElements: string) {
	const [caretPos, setCaretPos] = useState<CaretPos | null>(null);
	const [selection, setSelection] = useState<SelectionState | null>(null);

	useLayoutEffect(() => {
		if (!selection) return;
		const { textField, updateCaretCoords } = selection;
		updateCaretCoords();
		manageEventListeners("add", textField, ["selectionchange", "scroll", "resize"], updateCaretCoords);
		return () => {
			manageEventListeners("remove", textField, ["selectionchange", "scroll", "resize"], updateCaretCoords);
		};
	}, [selection]);

	useLayoutEffect(() => {
		function onSelectionChange() {
			const focusedElement = document.activeElement;
			if (container.contains(focusedElement) && (focusedElement instanceof HTMLInputElement || focusedElement instanceof HTMLTextAreaElement) && focusedElement.closest(includeElements)) {
				const textField = focusedElement;
				setSelection({
					textField,
					updateCaretCoords() {
						const { top: caretTop, left: caretLeft, height: caretHeight } = getCaretCoordinates(textField, textField.selectionStart!);
						let { top, left } = textField.getBoundingClientRect();
						top += caretTop - textField.scrollTop;
						left += caretLeft - textField.scrollLeft;
						// This is due to applying `parseInt` on `lineHeight: normal`
						setCaretPos({ top, bottom: top + (Number.isNaN(caretHeight) ? parseInt(window.getComputedStyle(textField).fontSize) : caretHeight), left });
					},
					replace(newText) {
						const { selectionStart, selectionEnd } = textField;
						textField.value = textField.value.slice(0, selectionStart!) + newText + textField.value.slice(selectionEnd!);
						textField.selectionStart = textField.selectionEnd = selectionStart! + newText.length;
						textField.focus();
					},
				});
				return;
			}
			const selection = document.getSelection();
			const ranges = selection
				? Array
					.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i))
					.filter(({ commonAncestorContainer }) => container.contains(commonAncestorContainer) && (commonAncestorContainer instanceof HTMLElement ? commonAncestorContainer : commonAncestorContainer.parentElement)?.closest(includeElements))
				: [];
			if (ranges.length) {
				const lastRange = ranges[ranges.length - 1];
				setSelection({
					textField: lastRange.commonAncestorContainer,
					updateCaretCoords() {
						const rects = lastRange.getClientRects();
						setCaretPos(rects.length ? rects[0] : null);
					},
					replace(newText) {
						selection!.removeAllRanges();
						for (const range of ranges) {
							const { startOffset, startContainer } = range;
							range.deleteContents();
							if (startContainer.nodeType === Node.TEXT_NODE) {
								(startContainer as Text).insertData(startOffset, newText);
								range.setStart(startContainer, startOffset + newText.length);
							}
							else {
								const newTextNode = document.createTextNode(newText);
								range.insertNode(newTextNode);
								range.setStart(newTextNode, newText.length);
							}
							range.collapse();
							selection!.addRange(range);
						}
					},
				});
				return;
			}
			setCaretPos(null);
			setSelection(null);
		}
		document.addEventListener("selectionchange", onSelectionChange);
		return () => {
			document.removeEventListener("selectionchange", onSelectionChange);
			setCaretPos(null);
			setSelection(null);
		};
	}, [container, includeElements]);

	return { caretPos, replaceSelection: selection?.replace };
}

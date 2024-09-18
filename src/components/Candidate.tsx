import { useCallback, useRef } from "react";

import { useLongPress } from "react-use";

import type { Candidate } from "../types";

export default function Candidate({ isHighlighted, candidate, selectCandidate, deleteCandidate }: {
	isHighlighted: boolean;
	candidate: Candidate;
	selectCandidate(): void;
	deleteCandidate(): void;
}) {
	const justDeletedCandidate = useRef(false);
	const _deleteCandidate = useCallback(() => {
		deleteCandidate();
		justDeletedCandidate.current = true;
	}, [deleteCandidate]);
	const longPressHandlers = useLongPress(_deleteCandidate, { isPreventDefault: false, delay: 800 });
	const cancelLongPress = longPressHandlers.onMouseUp;
	const _selectCandidate = useCallback(() => {
		if (justDeletedCandidate.current) {
			justDeletedCandidate.current = false;
		}
		else {
			cancelLongPress();
			selectCandidate();
		}
	}, [cancelLongPress, selectCandidate]);
	return <li>
		<button
			className={`candidate${isHighlighted ? " highlighted" : ""}`}
			onClick={_selectCandidate}
			{...longPressHandlers}>
			<div className="candidate-cell candidate-label">{candidate.label}</div>
			<div className="candidate-cell candidate-text">{candidate.text}</div>
			<div className="candidate-cell candidate-comment">{candidate.comment}</div>
		</button>
	</li>;
}

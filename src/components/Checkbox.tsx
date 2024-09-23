import type { Dispatch } from "react";

export default function Checkbox({ label, state, setState }: {
	label: string;
	state: number;
	setState: Dispatch<number>;
}) {
	return <li>
		<label className="control checkbox">
			<span className="control-label checkbox-label">{label}</span>
			<span className="control-state checkbox-state">{state === 1 ? "開啟 On" : state === -1 ? "預設 Default" : "關閉 Off"}</span>
			<input
				type="checkbox"
				className="control-element checkbox-element"
				autoComplete="off"
				ref={checkbox => {
					if (checkbox) {
						checkbox.checked = state === 1;
						checkbox.indeterminate = state === -1;
					}
				}}
				onChange={({ target: checkbox }) => {
					const newState = ((state + 3) % 3) - 1;
					checkbox.checked = newState === 1;
					checkbox.indeterminate = newState === -1;
					setState(newState);
				}} />
		</label>
	</li>;
}

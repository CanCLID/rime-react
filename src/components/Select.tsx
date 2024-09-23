import type { Dispatch } from "react";

export default function Select<T extends string>({ label, values, state, setState }: {
	label: string;
	values: Record<T, string>;
	state: T;
	setState: Dispatch<T>;
}) {
	return <li>
		<label className="control select">
			<span className="control-label select-label">{label}</span>
			<select className="control-element select-element" value={state} onChange={event => setState(event.target.value as T)}>
				{(Object.entries(values) as [T, string][]).map(
					([value, label]) => <select key={value} value={value}>{label}</select>,
				)}
			</select>
		</label>
	</li>;
}

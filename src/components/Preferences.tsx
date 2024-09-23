import { useState } from "react";

import useLocalStorageState from "use-local-storage-state";

import { SHOW_COMMMENTS_LABELS, ShowComments, WRITING_MODE_LABELS, WritingMode } from "../consts";
import Checkbox from "./Checkbox";
import Select from "./Select";
import useRimePreference from "../hooks/useRimePreference";

import type { RunAsyncTask } from "../types";

export default function Preferences({ runAsyncTask }: { runAsyncTask: RunAsyncTask }) {
	// XXX Fix Me
	const [pageSizeIsDefault, setPageSizeIsDefault] = useState(true);
	const [pageSize, setPageSize] = useRimePreference("pageSize", runAsyncTask);

	const [enableCompletion, setEnableCompletion] = useRimePreference("enableCompletion", runAsyncTask);
	const [enableCorrection, setEnableCorrection] = useRimePreference("enableCorrection", runAsyncTask);
	const [enableSentence, setEnableSentence] = useRimePreference("enableSentence", runAsyncTask);
	const [enableLearning, setEnableLearning] = useRimePreference("enableLearning", runAsyncTask);

	const [writingMode, setWritingMode] = useLocalStorageState("writingMode", { defaultValue: WritingMode.HorizontalTBLR });
	const [showComments, setShowComments] = useLocalStorageState("showComments", { defaultValue: ShowComments.Always });

	return <ul>
		<li>
			<label className="control checkbox">
				<span className="control-element checkbox-label">每頁候選詞數量 No. of Candidates Per Page</span>
				<span className="control-state checkbox-state">預設 Default</span>
				<input
					type="checkbox"
					className="control-element checkbox-element"
					autoComplete="off"
					checked={pageSizeIsDefault}
					onChange={event => setPageSizeIsDefault(event.target.checked)} />
				<div className="control range">
					<input
						type="range"
						className="control-element range-element"
						min="3"
						max="10"
						step="1"
						value={pageSize}
						onChange={event => setPageSize(+event.target.value)} />
					<div className="range-ticks" aria-hidden>
						<span className="range-tick" data-tick="3"></span>
						<span className="range-tick" data-tick="4"></span>
						<span className="range-tick" data-tick="5"></span>
						<span className="range-tick" data-tick="6"></span>
						<span className="range-tick" data-tick="7"></span>
						<span className="range-tick" data-tick="8"></span>
						<span className="range-tick" data-tick="9"></span>
						<span className="range-tick" data-tick="10"></span>
					</div>
				</div>
			</label>
		</li>
		<Select label="候選詞顯示方向 Candidate Display Orientation" values={WRITING_MODE_LABELS} state={writingMode} setState={setWritingMode} />
		<Select label="候選詞註解 Candidate Comments" values={SHOW_COMMMENTS_LABELS} state={showComments} setState={setShowComments} />
		<Checkbox label="自動完成 Auto-completion" state={enableCompletion} setState={setEnableCompletion} />
		<Checkbox label="自動校正 Auto-correction" state={enableCorrection} setState={setEnableCorrection} />
		<Checkbox label="自動組詞 Auto-composition" state={enableSentence} setState={setEnableSentence} />
		<Checkbox label="輸入記憶 Input Memory" state={enableLearning} setState={setEnableLearning} />
	</ul>;
}

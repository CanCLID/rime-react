import type { ShowComments, WritingMode } from "./consts";

export interface RimeAPI {
	init(): boolean;
	set_schema(schema_id: string): boolean;
	set_option(option: string, value: number): void;
	set_preference(option: string, value: number): void;
	process_key(input: string): string;
	select_candidate(index: number): string;
	delete_candidate(index: number): string;
	flip_page(backward: boolean): string;
	clear_input(): string;
	deploy(): boolean;
}

export interface Actions {
	initialize(baseURL: string | URL, pathToRimeJS: string | URL, pathToRimeWASM: string | URL): Promise<void>;
	setSchemaFiles(prefix: string, schemaFiles: Record<string, string>): Promise<boolean>;
	setSchema(id: string): Promise<boolean>;
	setOption(option: string, value: number): Promise<void>;
	setPreference(option: keyof RimePreferences, value: number): Promise<boolean>;
	processKey(input: string): Promise<RimeResult>;
	selectCandidate(index: number): Promise<RimeResult>;
	deleteCandidate(index: number): Promise<RimeResult>;
	flipPage(backward: boolean): Promise<RimeResult>;
	clearInput(): Promise<RimeResult>;
	deploy(): Promise<boolean>;
}

export interface Schema {
	id: string;
	name: string;
}

export interface SwitchOption {
	isRadio: boolean;
	currentIndex: number;
	resetIndex: number;
	switches: Switch[];
}

export interface Switch {
	name: string;
	label: string;
	abbrev: string;
}

interface InputBuffer {
	before: string;
	active: string;
	after: string;
}

export interface Candidate {
	label: string;
	text: string;
	comment?: string;
}

interface RimeComposing {
	isComposing: true;
	inputBuffer: InputBuffer;
	page: number;
	isLastPage: boolean;
	highlightedIndex: number;
	candidates: Candidate[];
}

interface RimeNotComposing {
	isComposing: false;
}

interface RimePayload {
	success: boolean;
	committed?: string;
}

export type RimeResult = (RimeComposing | RimeNotComposing) & RimePayload;

export type RimeDeployStatus = "start" | "success" | "failure";

export interface RimeEvent {
	deploy: RimeDeployStatus;
	schema_list: string;
	schema: `${string}/${string}`;
	switches_list: string;
	option: string;
}

export interface ListenerArgsMap {
	deployStatusChanged: [status: RimeDeployStatus];
	schemaListChanged: [newSchemaList: Schema[]];
	schemaChanged: [id: string, name: string];
	switchesListChanged: [newSwitchesList: SwitchOption[]];
	optionChanged: [option: string, value: boolean];
}

interface NamedMessage<K extends keyof Actions> {
	name: K;
	args: Parameters<Actions[K]>;
	resolve: (value: ReturnType<Actions[K]>) => void;
	reject: (reason: unknown) => void;
}

export type Message = NamedMessage<keyof Actions>;

export type RunAsyncTask = (asyncTask: () => Promise<void>) => void;

export type RimeInstance = typeof import("./rime.ts");

export interface RimeContextState {
	isLoading: boolean;
	isInitialized: boolean;
	isDeploying: boolean;
	// DTS Bundle Generator can’t transform `RimeInstance["subscribe"]`
	subscribe: typeof import("./rime.ts").subscribe;
}

export interface InputState {
	isPrevDisabled: boolean;
	isNextDisabled: boolean;
	inputBuffer: InputBuffer;
	candidates: Candidate[];
	highlightedIndex: number;
}

export interface CaretPos {
	top: number;
	bottom: number;
	left: number;
}

export interface SelectionState {
	textField: Node;
	updateCaretCoords(): void;
	replace(newText: string): void;
}

export interface RimePreferences {
	pageSize: number;
	enableCompletion: boolean;
	enableCorrection: boolean;
	enableSentence: boolean;
	enableLearning: boolean;
}

export interface InterfacePreferences {
	writingMode: WritingMode;
	showComments: ShowComments;
}

export interface Preferences extends RimePreferences, InterfacePreferences {}

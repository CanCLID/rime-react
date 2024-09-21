export interface RimeAPI {
	init(): boolean;
	process_key(input: string): boolean;
	select_candidate(index: number): boolean;
	delete_candidate(index: number): boolean;
	flip_page(backward: boolean): boolean;
	clear_input(): void;
	deploy(): boolean;
}

export interface Actions {
	initialize(baseURL: string | URL, pathToRimeJS: string | URL, pathToRimeWASM: string | URL): Promise<void>;
	setSchemaFiles(prefix: string, schemaFiles: Record<string, string>): Promise<boolean>;
	processKey(input: string): Promise<boolean>;
	selectCandidate(index: number): Promise<boolean>;
	deleteCandidate(index: number): Promise<boolean>;
	flipPage(backward: boolean): Promise<boolean>;
	clearInput(): Promise<void>;
	deploy(): Promise<boolean>;
}

interface InputBuffer {
	before: string;
	active: string;
	after: string;
}

export interface Candidate {
	label?: string;
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
	committed?: string;
}

export type RimeInputStatus = (RimeComposing | RimeNotComposing) & RimePayload;

export type RimeDeployStatus = "start" | "success" | "failure";

export interface RimeEvent {
	deploy: RimeDeployStatus;
	input: RimeInputStatus;
}

export interface ListenerArgsMap {
	deployStatusChanged: [status: RimeDeployStatus];
	inputStatusChanged: [status: RimeInputStatus];
}

interface NamedMessage<K extends keyof Actions> {
	name: K;
	args: Parameters<Actions[K]>;
	resolve: (value: ReturnType<Actions[K]>) => void;
	reject: (reason: unknown) => void;
}

export type Message = NamedMessage<keyof Actions>;

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

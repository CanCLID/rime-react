export interface RimeAPI {
	init(): boolean;
	process_key(input: string): string;
	select_candidate(index: number): string;
	delete_candidate(index: number): string;
	flip_page(backward: boolean): string;
	clear_input(): string;
	deploy(): boolean;
}

export interface Actions {
	initialize(pathToRimeJS: string, pathToRimeWASM: string): Promise<void>;
	setSchemaFiles(prefix: string, schemaFiles: Record<string, string>): Promise<boolean>;
	processKey(input: string): Promise<RimeResult>;
	selectCandidate(index: number): Promise<RimeResult>;
	deleteCandidate(index: number): Promise<RimeResult>;
	flipPage(backward: boolean): Promise<RimeResult>;
	clearInput(): Promise<RimeResult>;
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
	success: boolean;
	committed?: string;
}

export type RimeResult = (RimeComposing | RimeNotComposing) & RimePayload;

export type RimeDeployStatus = "start" | "success" | "failure";

export interface RimeNotification {
	deploy: RimeDeployStatus;
}

export interface ListenerArgsMap {
	deployStatusChanged: [status: RimeDeployStatus];
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

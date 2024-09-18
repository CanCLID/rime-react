export function isPrintable(key: string) {
	return key.length === 1 && key >= " " && key <= "~";
}

export function manageEventListeners<K extends keyof GlobalEventHandlersEventMap>(
	action: "add" | "remove",
	element: Node,
	eventNames: K[],
	listener: (this: GlobalEventHandlers, event: GlobalEventHandlersEventMap[K]) => void,
) {
	let currentElement: Node | null = element;
	while (currentElement) {
		for (const eventName of eventNames) {
			currentElement[`${action}EventListener`](eventName, listener as never);
		}
		currentElement = currentElement.parentElement;
	}
	for (const eventName of eventNames) {
		window[`${action}EventListener`](eventName, listener as never);
	}
}

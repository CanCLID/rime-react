import { useRef } from "react";

import ReactShadowRoot from "react-shadow-root";

import type { CaretPos } from "../types";
import type { CSSProperties, ReactNode } from "react";

declare const candidateWrapperStylesSource: string;

export default function CandidateWrapper({ caretPos, children }: { caretPos: CaretPos; children: ReactNode }) {
	const panelRef = useRef<HTMLDivElement>(null);
	const { top: caretTop, bottom: caretBottom, left: caretLeft } = caretPos;
	let panelStyleX: CSSProperties = { left: caretLeft };
	let panelStyleY: CSSProperties = { top: caretBottom };
	if (panelRef.current) {
		const { width: panelWidth, height: panelHeight } = panelRef.current.getBoundingClientRect();
		if (caretLeft + panelWidth > innerWidth) {
			panelStyleX = { right: 0 };
		}
		if (caretBottom + panelHeight > innerHeight) {
			panelStyleY = caretTop - panelHeight < 0 ? { top: 0 } : { bottom: innerHeight - caretTop };
		}
	}
	return <div ref={panelRef} style={{ ...panelStyleX, ...panelStyleY }}>
		<ReactShadowRoot>
			<style>{candidateWrapperStylesSource}</style>
			<div id="candidate-panel">{children}</div>
		</ReactShadowRoot>
	</div>;
}

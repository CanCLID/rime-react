import { createContext } from "react";

import type { RimeInstance, RimeContextState } from "./types";

export const RimeContext = createContext<RimeContextState | null>(null);

export const RimeInstanceContext = createContext<RimeInstance | null>(null);

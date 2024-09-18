import { createContext } from "react";

import type { RimeContextState } from "./types";

const RimeContext = createContext<RimeContextState | null>(null);

export default RimeContext;

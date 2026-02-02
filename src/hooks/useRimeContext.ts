import { useContext } from "react";

import { RimeContext } from "../contexts";

export default function useRimeContext() {
	const rimeContext = useContext(RimeContext);
	if (!rimeContext) {
		throw new Error("'useRimeContext' must be inside a 'RimeReact' component");
	}
	return rimeContext;
}

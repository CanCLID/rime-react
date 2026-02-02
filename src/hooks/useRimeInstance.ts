import { useContext } from "react";

import { RimeInstanceContext } from "../contexts";

export default function useRimeInstance() {
	const rimeInstance = useContext(RimeInstanceContext);
	if (!rimeInstance) {
		throw new Error("'useRimeInstance' must be inside a 'RimeReact' component");
	}
	return rimeInstance;
}

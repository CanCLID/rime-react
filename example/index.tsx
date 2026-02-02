import { createRoot } from "react-dom/client";
import { RimeReact, useRimeContext } from "rime-react";

const NO_AUTO_FILL = {
	autoComplete: "off",
	autoCorrect: "off",
	autoCapitalize: "off",
	spellCheck: "false",
} as const;

const assetsPrefix = process.env.NODE_ENV === "production" ? "" : "/assets/";
// Schema files live in example/public/schema. Update hashes when those files change.
const schemaFilesFetchPrefix = new URL("schema/", window.location.href).toString();

function Loading() {
	return useRimeContext().isLoading && <>
		<span id="loading-dots"></span>
		<span id="loading-label">Loading…</span>
	</>;
}

function Demo() {
	return <RimeReact
		pathToRimeJS={`${assetsPrefix}rime.js`}
		pathToRimeWASM={`${assetsPrefix}rime.wasm`}
		schemaFilesFetchPrefix={schemaFilesFetchPrefix}
		schemaFilesToSHA256={{
			"build/cangjie5.prism.bin": "67694e9f7f611458d39dd92b856b7b4e385c6886947bfda9213257ffa2172b70",
			"build/cangjie5.reverse.bin": "55418bd912ed2622dfe02cb57d30355b85de631283fcc14889338f32e8f0cc24",
			"build/cangjie5.schema.yaml": "a0fb9636749595b7d9183e0b3ca589e55530ea9bcace7f2852ae91eaa75dff50",
			"build/cangjie5.table.bin": "10b44a6dee3c4ae93f127b7337c7cfa8efbc950ac994f9301f37b64a7265ac68",
			"build/default.yaml": "d93a43ff9d1ac916bc7537e8274ab0d376b7dc7fe98b6aebe74f9a47214f6ef5",
			"build/luna_pinyin.prism.bin": "c1303aefe078544ec9c8a3f1f9b6887b5423a18a94e1068213891088750db817",
			"build/luna_pinyin.reverse.bin": "82e775596e751bfbd4b41c85e2369d27ca91615fd13dad03e253efb0fb41a05c",
			"build/luna_pinyin.schema.yaml": "1e490eb1c330db00e618158cade99e7449936dc4473c853db9ffc54414b7e82d",
			"build/luna_pinyin.table.bin": "3e6b0b4ca6bea497941435d697763a01865643ae5a02fc3df6e7bc33e9c135c7",
			"cangjie5.dict.yaml": "2dbc120d838ea1e30286f565060d6f84c11623ff1798fd52c97d50e370b833dd",
			"cangjie5.schema.yaml": "e112cc9624923befde28be408222d3bc3ca95df7c270c508d735570403e8b272",
			"default.yaml": "f199599315b4b6502072ac6e2afe8569fec917847b558d5a40a1859a4286eb1c",
			"essay.txt": "3d11a425aa14a47f536812bc60021138bf6aacbe7da69fc0c4fb04f85811173e",
			"installation.yaml": "7ed5a38e3360bf3733db4deb644e32669c66f4fb0a54106547ae2dd5a874eb13",
			"luna_pinyin.dict.yaml": "971baa1f38a42d3d82f858b5bbdcad6482371f8d93a2f5d5c4ab341046419e3b",
			"luna_pinyin.schema.yaml": "33ae5531d6e220089edd14a9e8a52e38b6dee13eb51795aa93ba5ff97140ab38",
			"symbols.yaml": "e4cda5663039e284ce62d7febe207bf6b788df6a9705ca174fabd7f8c140ed30",
			"user.yaml": "68db28824846f1c89a539a9e252de4b0e487f3ff6a61618383880493a834ea8e"
		}}
		onError={console.error}>
		<main>
			<div id="heading">
				<h1>RIME React Demo</h1>
				<Loading />
			</div>
			<input type="text" className="text-field" {...NO_AUTO_FILL} defaultValue="A universal and extensible input method available at your fingertips" />
			<textarea className="text-field" {...NO_AUTO_FILL} defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." />
			<textarea
				className="text-field"
				{...NO_AUTO_FILL}
				defaultValue="The RIME React component library is a React wrapper for RIME, a lightweight and highly customizable input method engine."
			/>
		</main>
	</RimeReact>;
}

createRoot(document.getElementById("root")!).render(<Demo />);

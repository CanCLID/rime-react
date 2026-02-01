import { createRoot } from "react-dom/client";
import { RimeReact, useRimeContext } from "rime-react";

const NO_AUTO_FILL = {
	autoComplete: "off",
	autoCorrect: "off",
	autoCapitalize: "off",
	spellCheck: "false",
} as const;

const assetsPrefix = process.env.NODE_ENV === "production" ? "" : "/assets/";

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
		schemaFilesFetchPrefix="https://cdn.jsdelivr.net/gh/CanCLID/librime/data/minimal"
		schemaFilesToSHA256={{
			"build/cangjie5.prism.bin": "5e47829a92dfae9bf1732d2eb7e57f1e23572df940631ad9e2c524f051910fef",
			"build/cangjie5.reverse.bin": "55418bd912ed2622dfe02cb57d30355b85de631283fcc14889338f32e8f0cc24",
			"build/cangjie5.schema.yaml": "914319dd6cb1106befd808c8e06963cac127b1e020f54190323669889e9a66da",
			"build/cangjie5.table.bin": "10b44a6dee3c4ae93f127b7337c7cfa8efbc950ac994f9301f37b64a7265ac68",
			"build/default.yaml": "96acebfd062085c34448aa360414898b816fdaea83430299ac8f45ea969a375f",
			"build/luna_pinyin.prism.bin": "7a943d04fc92da80b20476f531ecea35ab0249c4d3cfd85f8a7972df23409fcf",
			"build/luna_pinyin.reverse.bin": "82e775596e751bfbd4b41c85e2369d27ca91615fd13dad03e253efb0fb41a05c",
			"build/luna_pinyin.schema.yaml": "6625c4440ecdcdb5503313c7836a52f26f47e87d5d53293904ed25c3b48b408f",
			"build/luna_pinyin.table.bin": "3e6b0b4ca6bea497941435d697763a01865643ae5a02fc3df6e7bc33e9c135c7",
			"cangjie5.dict.yaml": "2dbc120d838ea1e30286f565060d6f84c11623ff1798fd52c97d50e370b833dd",
			"cangjie5.schema.yaml": "e112cc9624923befde28be408222d3bc3ca95df7c270c508d735570403e8b272",
			"default.yaml": "f199599315b4b6502072ac6e2afe8569fec917847b558d5a40a1859a4286eb1c",
			"essay.txt": "3d11a425aa14a47f536812bc60021138bf6aacbe7da69fc0c4fb04f85811173e",
			"installation.yaml": "7ed5a38e3360bf3733db4deb644e32669c66f4fb0a54106547ae2dd5a874eb13",
			"luna_pinyin.dict.yaml": "971baa1f38a42d3d82f858b5bbdcad6482371f8d93a2f5d5c4ab341046419e3b",
			"luna_pinyin.schema.yaml": "f08549cd3275da3889cea302c6ec3ecc99346d5dae2a79b65e83d37f2c04d0a7",
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

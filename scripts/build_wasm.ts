import { promises as fs } from "node:fs";

import { run } from "./exec";

const libPath = "build/sysroot/usr/lib";
const exportedFunctions = [
	"_init",
	"_process_key",
	"_select_candidate",
	"_delete_candidate",
	"_flip_page",
	"_clear_input",
	"_deploy",
].join();

const buildType = process.env.BUILD_TYPE ?? "Release";

const compileArgs = [
	"-std=c++17",
	...(buildType === "Debug" ? ["-g"] : ["-O2", "-DBOOST_DISABLE_ASSERTS", "-DBOOST_DISABLE_CURRENT_LOCATION"]),
	"-s",
	"ALLOW_MEMORY_GROWTH=1",
	"-s",
	"MAXIMUM_MEMORY=4GB",
	"-s",
	`EXPORTED_FUNCTIONS=${exportedFunctions}`,
	"-s",
	"EXPORTED_RUNTIME_METHODS=[\"ccall\",\"FS\"]",
	"-I",
	"build/sysroot/usr/include",
	"-o",
	"dist/rime.js",
];

const libText = await fs.readFile(`${libPath}/librime.a`, "utf8");
const hasLogMessage = libText.includes("LogMessage");

const linkArgs = [
	"-fexceptions",
	"-l",
	"idbfs.js",
	"-L",
	libPath,
	"-Wl,--whole-archive",
	"-l",
	"rime",
	"-Wl,--no-whole-archive",
	"-l",
	"yaml-cpp",
	"-l",
	"leveldb",
	"-l",
	"marisa",
	"-l",
	"opencc",
	...(hasLogMessage ? ["-l", "glog"] : []),
];

await fs.mkdir("dist", { recursive: true });
await run("em++", ["-v", ...compileArgs, "wasm/api.cpp", ...linkArgs]);

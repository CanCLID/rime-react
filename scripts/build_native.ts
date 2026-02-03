import { promises as fs } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { argv, cwd, exit } from "node:process";

import { run } from "./exec";
import { patch } from "./utils";

const root = cwd();
const PLATFORM = platform();

const dst = "build";
const dstRime = "build/librime_native";

const cmakeDefCommon = [
	"-G", "Ninja",
	"-DCMAKE_BUILD_TYPE:STRING=Release",
	"-DCMAKE_POLICY_VERSION_MINIMUM=3.5",
];

const cmakeDef = [
	...cmakeDefCommon,
	"-B",
	dst,
	`-DCMAKE_INSTALL_PREFIX:PATH=${root}/librime`,
	"-DBUILD_SHARED_LIBS:BOOL=OFF",
];

const cmakeDefRime = [
	...cmakeDefCommon,
	"-DBUILD_SHARED_LIBS:BOOL=ON",
	...(PLATFORM === "linux" ? [] : ["-DBUILD_STATIC:BOOL=ON"]),
	"-DBUILD_TEST:BOOL=OFF",
	`-DBoost_INCLUDE_DIR:PATH=${root}/build/sysroot/usr/include`,
	"-DENABLE_TIMESTAMP:BOOL=OFF",
	"-DENABLE_LOGGING:BOOL=OFF",
];

const env = { ...process.env };
if (PLATFORM !== "linux") {
	env.BOOST_ROOT = `${root}/boost`;
}

let hasError = false;

const targetHandlers: Record<string, () => Promise<void>> = {
	async "yaml-cpp"() {
		console.log("Building yaml-cpp");
		await fs.rm(join("librime/deps/yaml-cpp", dst), { recursive: true, force: true });
		await run(
			"cmake",
			[
				".",
				...cmakeDef,
				"-DYAML_CPP_BUILD_CONTRIB:BOOL=OFF",
				"-DYAML_CPP_BUILD_TESTS:BOOL=OFF",
				"-DYAML_CPP_BUILD_TOOLS:BOOL=OFF",
			],
			{ cwd: "librime/deps/yaml-cpp", env },
		);
		await run("cmake", ["--build", dst], { cwd: "librime/deps/yaml-cpp", env });
		await run("cmake", ["--install", dst], { cwd: "librime/deps/yaml-cpp", env });
	},

	async "leveldb"() {
		console.log("Building leveldb");
		await fs.rm(join("librime/deps/leveldb", dst), { recursive: true, force: true });
		await run(
			"cmake",
			[
				".",
				...cmakeDef,
				"-DCMAKE_CXX_FLAGS:STRING=-Wno-error=deprecated-declarations",
				"-DLEVELDB_BUILD_BENCHMARKS:BOOL=OFF",
				"-DLEVELDB_BUILD_TESTS:BOOL=OFF",
			],
			{ cwd: "librime/deps/leveldb", env },
		);
		await run("cmake", ["--build", dst], { cwd: "librime/deps/leveldb", env });
		await run("cmake", ["--install", dst], { cwd: "librime/deps/leveldb", env });
	},

	async "marisa"() {
		console.log("Building marisa-trie");
		await patch("marisa.patch", "librime/deps/marisa-trie");
		await fs.rm(join("librime/deps/marisa-trie", dst), { recursive: true, force: true });
		await run("cmake", [".", ...cmakeDef], { cwd: "librime/deps/marisa-trie", env });
		await run("cmake", ["--build", dst], { cwd: "librime/deps/marisa-trie", env });
		await run("cmake", ["--install", dst], { cwd: "librime/deps/marisa-trie", env });
	},

	async "opencc"() {
		console.log("Building opencc");
		await patch("opencc.patch", "librime/deps/opencc");
		await fs.rm(join("librime/deps/opencc", dst), { recursive: true, force: true });
		await run(
			"cmake",
			[
				".",
				...cmakeDef,
				`-DCMAKE_FIND_ROOT_PATH:PATH=${root}/librime`,
				"-DENABLE_DARTS:BOOL=OFF",
				"-DUSE_SYSTEM_MARISA:BOOL=ON",
			],
			{ cwd: "librime/deps/opencc", env },
		);
		await run("cmake", ["--build", dst], { cwd: "librime/deps/opencc", env });
		await run("cmake", ["--install", dst], { cwd: "librime/deps/opencc", env });
	},

	async "glog"() {
		console.error("'glog' need not be built in phase 'native'");
		hasError = true;
	},

	async "rime"() {
		console.log("Building librime");
		await patch("librime.patch", "librime");
		await fs.rm(dstRime, { recursive: true, force: true });
		await run("cmake", ["librime", "-B", dstRime, ...cmakeDefRime], { env });
		await run("cmake", ["--build", dstRime], { env });
	},
};

function needNotBeBuilt(target: string) {
	return async () => {
		console.error(`'${target}' need not be built in Linux in phase 'native'`);
		hasError = true;
	};
}

const nonPosixTargets = ["yaml-cpp", "leveldb", "marisa", "opencc"];
if (PLATFORM === "linux") {
	for (const target of nonPosixTargets) {
		targetHandlers[target] = needNotBeBuilt(target);
	}
}

const buildTargets = new Set(argv.slice(2));
const knownTargets = new Set(Object.keys(targetHandlers));
const unknownTargets = new Set([...buildTargets].filter(target => !knownTargets.has(target)));
if (unknownTargets.size) {
	throw new Error(`Unknown targets: '${[...unknownTargets].join("', '")}'`);
}

for (const [target, handler] of Object.entries(targetHandlers)) {
	if (buildTargets.has(target)) {
		await handler();
	}
}
if (hasError) {
	exit(1);
}

if (!buildTargets.size) {
	const allTargets = PLATFORM === "linux" ? ["rime"] : [...nonPosixTargets, "rime"];
	for (const target of allTargets) {
		await targetHandlers[target]();
	}
}

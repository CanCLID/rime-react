import { promises as fs } from "node:fs";
import { argv, cwd } from "node:process";

import { run } from "./exec";
import { patch } from "./utils";

const root = cwd();
const ENABLE_LOGGING = process.env.ENABLE_LOGGING ?? "ON";
const BUILD_TYPE = process.env.BUILD_TYPE ?? "Release";
const CXXFLAGS = "-fexceptions -DBOOST_DISABLE_CURRENT_LOCATION";
const DESTDIR = `${root}/build/sysroot`;
const CMAKE_FIND_ROOT_PATH = `${DESTDIR}/usr`;

const cmakeDef = [
	"-G", "Ninja",
	"-DCMAKE_INSTALL_PREFIX:PATH=/usr",
	`-DCMAKE_BUILD_TYPE:STRING=${BUILD_TYPE}`,
	"-DCMAKE_POLICY_VERSION_MINIMUM=3.5",
	"-DBUILD_SHARED_LIBS:BOOL=OFF",
];

const env = { ...process.env, CXXFLAGS, DESTDIR };

const targetHandlers: Record<string, () => Promise<void>> = {
	async "yaml-cpp"() {
		console.log("Building yaml-cpp");
		const src = "librime/deps/yaml-cpp";
		const dst = "build/yaml-cpp";
		await fs.rm(dst, { recursive: true, force: true });
		await run(
			"emcmake",
			[
				"cmake",
				src,
				"-B",
				dst,
				...cmakeDef,
				"-DYAML_CPP_BUILD_CONTRIB:BOOL=OFF",
				"-DYAML_CPP_BUILD_TESTS:BOOL=OFF",
				"-DYAML_CPP_BUILD_TOOLS:BOOL=OFF",
			],
			{ env },
		);
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},

	async "leveldb"() {
		console.log("Building leveldb");
		const src = "librime/deps/leveldb";
		const dst = "build/leveldb";
		await patch("leveldb.patch", src);
		await fs.rm(dst, { recursive: true, force: true });
		await run(
			"emcmake",
			[
				"cmake",
				src,
				"-B",
				dst,
				...cmakeDef,
				"-DLEVELDB_BUILD_BENCHMARKS:BOOL=OFF",
				"-DLEVELDB_BUILD_TESTS:BOOL=OFF",
			],
			{ env },
		);
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},

	async "marisa"() {
		console.log("Building marisa-trie");
		const src = "librime/deps/marisa-trie";
		const dst = "build/marisa-trie";
		await patch("marisa.patch", src);
		await fs.rm(dst, { recursive: true, force: true });
		await run("emcmake", ["cmake", src, "-B", dst, ...cmakeDef], { env });
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},

	async "opencc"() {
		console.log("Building opencc");
		const src = "librime/deps/opencc";
		const dst = "build/opencc";
		await patch("opencc.patch", src);
		await fs.rm(dst, { recursive: true, force: true });
		await run(
			"emcmake",
			[
				"cmake",
				src,
				"-B",
				dst,
				...cmakeDef,
				`-DCMAKE_FIND_ROOT_PATH:PATH=${CMAKE_FIND_ROOT_PATH}`,
				"-DSHARE_INSTALL_PREFIX:PATH=/usr/share/rime-data/",
				"-DENABLE_DARTS:BOOL=OFF",
				"-DUSE_SYSTEM_MARISA:BOOL=ON",
			],
			{ env },
		);
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},

	async "glog"() {
		if (ENABLE_LOGGING !== "ON") {
			console.log("Skip glog");
			return;
		}
		console.log("Building glog");
		const src = "librime/deps/glog";
		const dst = "build/glog";
		await patch("glog.patch", src);
		await fs.rm(dst, { recursive: true, force: true });
		await run(
			"emcmake",
			[
				"cmake",
				src,
				"-B",
				dst,
				...cmakeDef,
				"-DWITH_GFLAGS:BOOL=OFF",
				"-DBUILD_TESTING:BOOL=OFF",
				"-DWITH_UNWIND:BOOL=OFF",
			],
			{ env },
		);
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},

	async "rime"() {
		console.log("Building librime");
		const src = "librime";
		const dst = "build/librime_wasm";
		await patch("librime.patch", src);
		await fs.rm(dst, { recursive: true, force: true });
		await run(
			"emcmake",
			[
				"cmake",
				src,
				"-B",
				dst,
				...cmakeDef,
				`-DCMAKE_FIND_ROOT_PATH:PATH=${CMAKE_FIND_ROOT_PATH}`,
				"-DBUILD_TEST:BOOL=OFF",
				"-DBUILD_STATIC:BOOL=ON",
				"-DENABLE_THREADING:BOOL=OFF",
				"-DENABLE_TIMESTAMP:BOOL=OFF",
				`-DENABLE_LOGGING:BOOL=${ENABLE_LOGGING}`,
			],
			{ env },
		);
		await run("cmake", ["--build", dst], { env });
		await run("cmake", ["--install", dst], { env });
	},
};

const buildTargets = new Set(argv.slice(2));
const knownTargets = new Set(Object.keys(targetHandlers));
const unknownTargets = new Set([...buildTargets].filter(target => !knownTargets.has(target)));
if (unknownTargets.size) {
	throw new Error(`Unknown targets: '${[...unknownTargets].join("', '")}'`);
}

for (const [target, handler] of Object.entries(targetHandlers)) {
	if (!buildTargets.size || buildTargets.has(target)) {
		await handler();
	}
}

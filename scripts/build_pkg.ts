import { $ } from "bun";

import esbuild from "esbuild";

const { outputFiles, warnings, errors } = await esbuild.build({
	entryPoints: ["src/styles/CandidateWrapper.css"],
	minify: true,
	write: false,
});

if (warnings.length) {
	console.warn(new AggregateError(warnings, "Warnings on building 'CandidateWrapper.css'"));
}

if (errors.length) {
	throw new AggregateError(errors, "Failed to build 'CandidateWrapper.css'");
}

const [candidateWrapperStyles] = outputFiles;

const { outputs: [worker], success: buildWorkerSuccess, logs: buildWorkerLogs } = await Bun.build({
	entrypoints: ["./src/worker.ts"],
	minify: true,
});

if (!buildWorkerSuccess) {
	throw new AggregateError(buildWorkerLogs, "Failed to build 'worker.ts'");
}

const { outputs: [index], success: buildIndexSuccess, logs: buildIndexLogs } = await Bun.build({
	entrypoints: ["./src/index.ts"],
	external: ["react", "react-dom"],
	define: {
		workerSource: JSON.stringify(await worker.text()),
		candidateWrapperStylesSource: JSON.stringify(new TextDecoder().decode(candidateWrapperStyles.contents)),
	},
	minify: {
		syntax: true,
	},
});

if (!buildIndexSuccess) {
	throw new AggregateError(buildIndexLogs, "Failed to build 'index.ts'");
}

await Bun.write(
	"./dist/index.js",
	(await index.text())
		// https://github.com/oven-sh/bun/issues/3768
		.replaceAll("react/jsx-dev-runtime", "react/jsx-runtime")
		.replaceAll("jsxDEV", "jsx")
		// This is needed such that the module doesn’t get nested (`{ default: { default: ReactShadowRoot }}`)
		.replace(
			"import_react_shadow_root = __toESM(require_lib(), 1)",
			"import_react_shadow_root = __toESM(require_lib(), 0)",
		),
);

await $`bunx dts-bundle-generator --no-check -o dist/index.d.ts src/index.ts`;

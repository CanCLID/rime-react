import esbuild from "esbuild";
import { promises as fs } from "node:fs";

import { run } from "./exec";

const cssResult = await esbuild.build({
	entryPoints: ["src/styles/CandidateWrapper.css"],
	minify: true,
	write: false,
});

if (cssResult.warnings.length) {
	console.warn(new AggregateError(cssResult.warnings, "Warnings on building 'CandidateWrapper.css'"));
}

const candidateWrapperStyles = cssResult.outputFiles[0].text;

const workerResult = await esbuild.build({
	entryPoints: ["src/worker.ts"],
	bundle: true,
	format: "iife",
	platform: "browser",
	minify: true,
	write: false,
});

if (workerResult.warnings.length) {
	console.warn(new AggregateError(workerResult.warnings, "Warnings on building 'worker.ts'"));
}

const workerSource = workerResult.outputFiles[0].text;

const indexResult = await esbuild.build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	format: "esm",
	platform: "browser",
	external: ["react", "react-dom", "react-shadow-root", "react-use"],
	define: {
		workerSource: JSON.stringify(workerSource),
		candidateWrapperStylesSource: JSON.stringify(candidateWrapperStyles),
	},
	minifySyntax: true,
	write: false,
});

if (indexResult.warnings.length) {
	console.warn(new AggregateError(indexResult.warnings, "Warnings on building 'index.ts'"));
}

let indexOutput = indexResult.outputFiles[0].text;
indexOutput = indexOutput.replaceAll("react/jsx-dev-runtime", "react/jsx-runtime");
indexOutput = indexOutput.replaceAll("jsxDEV", "jsx");
indexOutput = indexOutput.replace(
	"import_react_shadow_root = __toESM(require_lib(), 1)",
	"import_react_shadow_root = __toESM(require_lib(), 0)",
);

await fs.mkdir("dist", { recursive: true });
await fs.writeFile("dist/index.js", indexOutput);

await run("npm", [
	"exec",
	"--",
	"dts-bundle-generator",
	"--no-check",
	"-o",
	"dist/index.d.ts",
	"src/index.ts",
]);

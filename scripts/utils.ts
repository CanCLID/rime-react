import { join } from "node:path";
import { cwd } from "node:process";

import { run, runOutput } from "./exec";

const root = cwd();

export async function patch(patchFile: string, path?: string) {
	const options = path ? { cwd: path } : undefined;
	const { stdout } = await runOutput(
		"git",
		["status", "--porcelain", "-uno", "--ignore-submodules"],
		options,
	);
	if (!stdout.trim()) {
		await run("git", ["apply", join(root, "patches", patchFile)], options);
	}
}

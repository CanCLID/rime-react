import { spawn } from "node:child_process";

function formatCommand(cmd: string, args: string[]) {
	return [cmd, ...args].join(" ");
}

export function run(
	cmd: string,
	args: string[] = [],
	options: Parameters<typeof spawn>[2] = {},
) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(cmd, args, {
			stdio: "inherit",
			...options,
		});
		child.on("error", reject);
		child.on("close", code => {
			if (code === 0) {
				resolve();
			}
			else {
				reject(new Error(`Command failed (${code}): ${formatCommand(cmd, args)}`));
			}
		});
	});
}

export function runOutput(
	cmd: string,
	args: string[] = [],
	options: Parameters<typeof spawn>[2] = {},
) {
	return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
		const child = spawn(cmd, args, {
			stdio: ["ignore", "pipe", "pipe"],
			...options,
		});
		let stdout = "";
		let stderr = "";
		child.stdout?.on("data", chunk => {
			stdout += String(chunk);
		});
		child.stderr?.on("data", chunk => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("close", code => {
			if (code === 0) {
				resolve({ stdout, stderr });
			}
			else {
				reject(new Error(`Command failed (${code}): ${formatCommand(cmd, args)}\n${stderr}`));
			}
		});
	});
}

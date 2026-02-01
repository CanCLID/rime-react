import { promises as fs } from "node:fs";
import { join } from "node:path";

import { run } from "./exec";

const includeDir = "build/sysroot/usr/include";
const boostVersion = "1.85.0";
const archiveName = `boost-${boostVersion}-cmake.tar.xz`;

async function exists(path: string) {
	try {
		await fs.access(path);
		return true;
	}
	catch {
		return false;
	}
}

async function copyDirContents(src: string, dest: string) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = join(src, entry.name);
		const destPath = join(dest, entry.name);
		if (entry.isDirectory()) {
			await copyDirContents(srcPath, destPath);
		}
		else if (entry.isSymbolicLink()) {
			const link = await fs.readlink(srcPath);
			await fs.symlink(link, destPath);
		}
		else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

async function copyBoostHeaders() {
	const boostInclude = join(includeDir, "boost");
	await fs.rm(boostInclude, { recursive: true, force: true });
	await fs.mkdir(boostInclude, { recursive: true });

	const libsDir = join("boost", "libs");
	const libs = await fs.readdir(libsDir, { withFileTypes: true });
	for (const lib of libs) {
		if (!lib.isDirectory()) continue;
		const includePath = join(libsDir, lib.name, "include", "boost");
		if (await exists(includePath)) {
			await copyDirContents(includePath, boostInclude);
		}
	}

	const numericDir = join(libsDir, "numeric");
	if (await exists(numericDir)) {
		const numericLibs = await fs.readdir(numericDir, { withFileTypes: true });
		for (const lib of numericLibs) {
			if (!lib.isDirectory()) continue;
			const includePath = join(numericDir, lib.name, "include", "boost");
			if (await exists(includePath)) {
				await copyDirContents(includePath, boostInclude);
			}
		}
	}
}

if (!await exists(archiveName)) {
	const url = `https://github.com/boostorg/boost/releases/download/boost-${boostVersion}/${archiveName}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download ${url} (${response.status})`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	await fs.writeFile(archiveName, buffer);
	await fs.rm("boost", { recursive: true, force: true });
}

if (!await exists("boost")) {
	await run("tar", ["-xvf", archiveName]);
	await fs.rename(`boost-${boostVersion}`, "boost");
}

await copyBoostHeaders();

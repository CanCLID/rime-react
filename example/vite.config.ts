import { resolve } from "node:path";

import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";

import type { UserConfig } from "vite";

export default {
	base: "./",
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				{
					src: "node_modules/rime-react/dist/*r*.*",
					dest: "assets",
				},
			],
		}),
	],
	resolve: {
		alias: {
			react: resolve(__dirname, "node_modules/react"),
			"react-dom": resolve(__dirname, "node_modules/react-dom"),
		},
		dedupe: ["react", "react-dom"],
		preserveSymlinks: true,
	},
	build: {
		target: "esnext",
	},
} satisfies UserConfig;

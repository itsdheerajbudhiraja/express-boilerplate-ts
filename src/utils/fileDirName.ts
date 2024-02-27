import { dirname } from "path";
import { fileURLToPath } from "url";

export function dirName(meta: ImportMeta) {
	const __filename = fileURLToPath(meta.url);

	const __dirname = dirname(__filename);

	return __dirname;
}

export function fileName(meta: ImportMeta) {
	const __filename = fileURLToPath(meta.url);

	return __filename;
}

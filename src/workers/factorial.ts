import { initSync } from "rust-wasm-libs";
import { logger } from "../winston_logger.js";
import { readFileSync } from "fs";
import path from "path";
import { dirName } from "../utils/fileDirName.js";

logger.info("Initializing rust wasm");
initSync(
	readFileSync(path.join(dirName(import.meta), "../../rust-wasm-libs/pkg/rust_wasm_libs_bg.wasm"))
);
logger.info("Rust wasm initialized successfully");

async function factorial(number: bigint) {
	const factorialRust = await import("rust-wasm-libs");
	const factorial = await factorialRust.factorial_rust(number);
	return factorial;
}

export { factorial };

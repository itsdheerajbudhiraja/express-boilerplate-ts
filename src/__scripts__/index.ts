import "../dotenv.js";

import esMain from "es-main";
import { readdir } from "fs/promises";
import inquirer from "inquirer";
import { join } from "path";

import { db } from "../db/index.js";
import { dirName } from "../utils/fileDirName.js";
import { logger } from "../winston_logger.js";

async function main(scripts?: string | string[]) {
	const files = await readdir(join(dirName(import.meta), "./"));

	const availableScripts: string[] = [];
	files
		.filter((fileName) => fileName.match("^script.*.js$"))
		.forEach((script) => {
			availableScripts.push(script.slice(6, script.length - 3));
		});

	logger.debug("Available Scripts: %o", availableScripts);

	let selectedScripts: string[];

	if (typeof scripts == "string") {
		if (scripts == "all") {
			selectedScripts = availableScripts;
		} else {
			if (!availableScripts.includes(scripts)) {
				throw new Error(
					`Invalid Script name: ${scripts} passed, valid scripts are: ${JSON.stringify(availableScripts)}`
				);
			}
			selectedScripts = [scripts];
		}
	} else if (Array.isArray(scripts)) {
		scripts.forEach((script) => {
			if (!availableScripts.includes(script)) {
				throw new Error(
					`Invalid Script name: ${script} passed, valid scripts are: ${JSON.stringify(availableScripts)}`
				);
			}
		});
		selectedScripts = scripts;
	} else {
		const selected = await inquirer.prompt({
			message: "Select all scripts to run",
			choices: availableScripts,
			name: "Scripts",
			type: "checkbox"
		});

		selectedScripts = selected.Scripts;
	}

	logger.info("Selected scripts to run : %o", selectedScripts);

	if (selectedScripts.length == 0) {
		logger.error("No script is selected for execution. Exiting ....");
		process.exit(0);
	}

	let errors = {};
	for (let i = 0; i < selectedScripts.length; i++) {
		try {
			logger.info("Starting execution of %o", selectedScripts[i]);
			const script = await import(`./script${selectedScripts[i]}.js`);

			const error = await script.main();
			errors = {
				...errors,
				...error
			};
		} catch (err) {
			logger.error("Error occurred in execution of script : %o - %o", selectedScripts[i], err);
		}
	}

	if (Object.keys(errors).length) {
		logger.error("Consolidated errors from all scripts: %o", errors);
	}
}

if (esMain(import.meta)) {
	await db.connect();
	await main().catch((err) => {
		logger.error("Error occurred in runScript : %o", err);
	});
	process.exit(0);
}

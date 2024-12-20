// Reading .env file
import chalk from "chalk";
import { ColorTranslator } from "colortranslator";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import dotenvParseVariables from "dotenv-parse-variables";
import figlet from "figlet";
import path from "path";
import typia from "typia";

import { dirName } from "./utils/fileDirName.js";

const envFile = process.env.ENV_FILE || ".env";

const env = dotenvExpand.expand(
	dotenv.config({ path: path.join(dirName(import.meta), `../${envFile}`) })
);

if (env.error) {
	console.error(env.error);
	process.exit(1);
}
const envs: { [key: string]: string } = {};
for (const i in env.parsed) {
	if (i in process.env) {
		envs[i] = process.env[i] as string;
	} else {
		envs[i] = env.parsed[i];
	}
}
const envParsed = dotenvParseVariables(envs);

process.env = { ...process.env, ...envParsed } as NodeJS.ProcessEnv;

// Show the banner with Application title and description on app start
const APPLICATION_TITLE = process.env.APPLICATION_TITLE;
const APPLICATION_DESCRIPTION = process.env.APPLICATION_DESCRIPTION;
const APPLICATION_TITLE_COLOR = process.env.APPLICATION_TITLE_COLOR;
const APPLICATION_DESCRIPTION_COLOR = process.env.APPLICATION_DESCRIPTION_COLOR;
const title = figlet.textSync(APPLICATION_TITLE);
console.log(chalk.hex(new ColorTranslator(APPLICATION_TITLE_COLOR).HEX)(title));
console.log(
	chalk.hex(new ColorTranslator(APPLICATION_DESCRIPTION_COLOR).HEX)(` ${APPLICATION_DESCRIPTION}\n`)
);

const validationResult = typia.validate<NodeJS.ProcessEnv>(process.env);
if (!validationResult.success && validationResult.errors.length) {
	console.error(
		chalk.hex(new ColorTranslator("red").HEX)(
			"Error occurred in type casting environment variables: " +
				JSON.stringify(validationResult.errors, null, 4)
		)
	);
	process.exit(1);
}

export default envParsed;

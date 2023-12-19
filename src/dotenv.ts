// Reading .env file
import dotenv from "dotenv";
import dotenvParseVariables from "dotenv-parse-variables";
import path from "path";
import { dirName } from "./utils/fileDirName.js";
import chalk from "chalk";
import figlet from "figlet";
import { ColorTranslator } from "colortranslator";

const envFile = process.env.ENV_FILE || ".env";

const env = dotenv.config({ path: path.join(dirName(import.meta), `../${envFile}`) });
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
const APPLICATION_TITLE = (process.env.APPLICATION_TITLE as string) || "Express Server";
const APPLICATION_DESCRIPTION =
	(process.env.APPLICATION_DESCRIPTION as string) || "Sample Typescript Express Server";
const APPLICATION_TITLE_COLOR =
	(process.env.APPLICATION_TITLE_COLOR as string) || "mediumaquamarine";
const APPLICATION_DESCRIPTION_COLOR =
	(process.env.APPLICATION_DESCRIPTION_COLOR as string) || "cyan";
const title = figlet.textSync(APPLICATION_TITLE);
console.log(chalk.hex(new ColorTranslator(APPLICATION_TITLE_COLOR).HEX)(title));
console.log(
	chalk.hex(new ColorTranslator(APPLICATION_DESCRIPTION_COLOR).HEX)(` ${APPLICATION_DESCRIPTION}\n`)
);

export default env;

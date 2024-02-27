import "winston-daily-rotate-file";
import type { ConsoleTransportOptions } from "winston/lib/winston/transports/index.js";
import type { DailyRotateFileTransportOptions } from "winston-daily-rotate-file";

import winston from "winston";

const colorizer = winston.format.colorize();

const alignColorsAndTimeForConsole = winston.format.combine(
	winston.format.splat(),
	winston.format.simple(),
	winston.format.timestamp({
		format: function () {
			return new Date().toISOString();
		}
	}),
	winston.format.printf((msg) =>
		colorizer.colorize(
			msg.level,
			`${msg.timestamp} [${msg.level}]${padding(msg.level)} ${msg.message}`
		)
	)
);

const padding = (text: string) => {
	const n = 5 - text.length;
	return " ".repeat(n) + "|";
};

const logsForFile = winston.format.combine(
	winston.format.splat(),
	winston.format.simple(),
	winston.format.timestamp({
		format: function () {
			return new Date().toISOString();
		}
	}),
	winston.format.printf(
		(msg) => `${msg.timestamp} [${msg.level}]${padding(msg.level)} ${msg.message}`
	)
);

const sanitize = (value: string) => {
	let sanitizedValue = value.replace(/(\r\n|\r|\n)/g, "");

	sanitizedValue = sanitizedValue.replace(/[^\w\s.-]/gi, "");
	return sanitizedValue;
};

const options = {
	console: <ConsoleTransportOptions>{
		level: process.env.LOG_LEVEL_CONSOLE || "info",
		handleExceptions: true,
		json: false,
		colorize: true,
		format: winston.format.combine(alignColorsAndTimeForConsole)
	},
	file: <DailyRotateFileTransportOptions>{
		level: process.env.LOG_LEVEL_FILE || "silly",
		filename: "app_%DATE%.log",
		dirname: "logs",
		datePattern: "YYYY-MM-DDTHH:mm:ss",
		handleExceptions: true,
		json: false,
		maxsize: "50m", // 50MB
		maxFiles: 100,
		colorize: false,
		format: winston.format.combine(logsForFile)
	}
};

interface CustomLogger extends winston.Logger {
	debugSanitized: (message: string, ...args: string[]) => void;
}

const logger = winston.createLogger({
	transports: [
		new winston.transports.DailyRotateFile(options.file),
		new winston.transports.Console(options.console)
	],
	exitOnError: false // do not exit on handled exceptions
}) as CustomLogger;

logger.debugSanitized = function debugSanitized(message: string, ...args: string[]) {
	const sanitizedArgs = args.map((arg) => sanitize(arg));
	logger.debug(message, ...sanitizedArgs);
};

export { logger };

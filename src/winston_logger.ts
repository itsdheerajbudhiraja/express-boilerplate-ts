import "winston-daily-rotate-file";
import type { AxiosError } from "axios";
import type { ConsoleTransportOptions } from "winston/lib/winston/transports/index.js";
import type { DailyRotateFileTransportOptions } from "winston-daily-rotate-file";

import { type AxiosResponse } from "axios";
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
		level: process.env.LOG_LEVEL_CONSOLE,
		handleExceptions: true,
		json: false,
		colorize: true,
		format: winston.format.combine(alignColorsAndTimeForConsole)
	},
	file: <DailyRotateFileTransportOptions>{
		level: process.env.LOG_LEVEL_FILE,
		filename: "app_%DATE%.log",
		dirname: "logs",
		datePattern: "YYYY-MM-DDTHH",
		handleExceptions: true,
		json: false,
		maxSize: "50m", // 50MB
		maxFiles: 1000,
		colorize: false,
		format: winston.format.combine(logsForFile)
	}
};

export interface CustomLogger extends winston.Logger {
	debugSanitized: (message: string, ...args: string[]) => void;
	axiosSuccessResponse: (message: string, response: AxiosResponse) => void;
	axiosErrorResponse: (message: string, error: AxiosError) => void;
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

logger.axiosSuccessResponse = function axiosSuccessResponse(
	message: string,
	response: AxiosResponse
) {
	const responseToLog = {
		status: response.status,
		data: response.data,
		url: response.config.url
	};
	logger.debug(message, responseToLog);
};

logger.axiosErrorResponse = function axiosErrorResponse(message: string, error: AxiosError) {
	const errorToLog = {
		code: error.code,
		status: error.response?.status,
		data: error.response?.data,
		url: error.response?.config.url,
		message: error.message
	};

	logger.error(message, errorToLog);
};

export { logger };

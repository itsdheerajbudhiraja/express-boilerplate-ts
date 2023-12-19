import { logger } from "../winston_logger.js";

function parseDuration(time: string | number) {
	try {
		if (typeof time == "number") {
			return time;
		}
		const number = Number(time.substring(0, time.length - 1));
		if (typeof number != "number" || isNaN(number)) {
			throw new Error("Invalid time format");
		}

		switch (time.substring(time.length - 1)) {
			case "s":
				return number * 1000;
			case "m":
				return number * 60 * 1000;
			case "h":
				return number * 60 * 60 * 1000;
			case "d":
				return number * 24 * 60 * 60 * 1000;
			default:
				throw new Error("Invalid time format.");
		}
	} catch (err) {
		logger.error("Error occurred in parseDuration: %o", err);
		throw err;
	}
}

export { parseDuration };

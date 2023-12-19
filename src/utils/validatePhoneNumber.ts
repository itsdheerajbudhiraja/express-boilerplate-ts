import { ValidationError } from "../errors/ValidationError.js";
import { logger } from "../winston_logger.js";
import { phone } from "phone";

async function validatePhoneNumber(phoneNo: string) {
	try {
		const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;

		const isValid = phone(phoneNo).isValid;

		if (!phoneNo || !phoneNo.startsWith("+") || !re.test(phoneNo) || !isValid) {
			throw new ValidationError("Error validating phone number: " + phoneNo);
		}
	} catch (err) {
		logger.error("Error occurred in validatePhoneNumber: %o", err);
		throw err;
	}
}

export { validatePhoneNumber };

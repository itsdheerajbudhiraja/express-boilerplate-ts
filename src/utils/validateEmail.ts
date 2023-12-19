import emailValidator from "deep-email-validator";
import { logger } from "../winston_logger.js";
import { ValidationError } from "../errors/ValidationError.js";

async function validateEmail(email: string) {
	try {
		const res = await emailValidator.validate({
			email: email,
			validateSMTP: false,
			additionalTopLevelDomains: JSON.parse(
				process.env.EMAIL_VALIDATOR_ADDITIONAL_TLDS as string
			) as unknown as string[]
		});
		if (!res.valid) {
			throw new ValidationError(
				`Email validation failed with reason: ${res.reason} - ${res.validators[
					res.reason as keyof typeof res.validators
				]?.reason}`
			);
		}
	} catch (err) {
		logger.error("Error occurred in validateEmail: %o", err);
		throw err;
	}
}

export { validateEmail };

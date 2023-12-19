import { Failure } from "../constants.js";
import { ApiFailureResponse } from "../types/ApiFailureResponse.js";

function failureResponse(message: string): ApiFailureResponse {
	return {
		status: Failure,
		message: message
	};
}

export { failureResponse };

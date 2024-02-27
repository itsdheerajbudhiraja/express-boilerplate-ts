import type { ApiFailureResponse } from "../types/ApiResponse.js";

import { Failure } from "../constants.js";

function failureResponse(message: string): ApiFailureResponse {
	return {
		status: Failure,
		message: message
	};
}

export { failureResponse };

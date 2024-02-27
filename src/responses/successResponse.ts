import type { ApiSuccessResponse } from "../types/ApiResponse.js";

import { Success } from "../constants.js";

function successResponse<T>(result: T): ApiSuccessResponse<T> {
	return {
		status: Success,
		result: result
	};
}

export { successResponse };

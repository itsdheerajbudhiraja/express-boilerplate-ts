import { Success } from "../constants.js";
import { ApiSuccessResponse } from "../types/ApiSuccessResponse.js";

function successResponse<T>(result: T): ApiSuccessResponse<T> {
	return {
		status: Success,
		result: result
	};
}

export { successResponse };

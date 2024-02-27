export type ApiSuccessResponse<T> = {
	status: "Success";
	result: T;
};

export type ApiFailureResponse = {
	status: "Failure";
	message: string;
};

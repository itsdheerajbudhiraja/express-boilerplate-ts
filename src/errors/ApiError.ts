import { ReasonPhrases, StatusCodes } from "http-status-codes";

class ApiError extends Error {
	statusCode: number;
	constructor(name: string, statusCode: number, message?: string) {
		super(message);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, ApiError.prototype);
		this.name = name;
		this.statusCode = statusCode;
	}
}

class BadRequest extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST, message);

		Object.setPrototypeOf(this, BadRequest.prototype);
	}
}

class Unauthorized extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.UNAUTHORIZED, StatusCodes.UNAUTHORIZED, message);

		Object.setPrototypeOf(this, Unauthorized.prototype);
	}
}

class Forbidden extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN, message);

		Object.setPrototypeOf(this, Forbidden.prototype);
	}
}

class NotFound extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.NOT_FOUND, StatusCodes.NOT_FOUND, message);

		Object.setPrototypeOf(this, NotFound.prototype);
	}
}

class Conflict extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.CONFLICT, StatusCodes.CONFLICT, message);

		Object.setPrototypeOf(this, Conflict.prototype);
	}
}

class UnprocessableEntity extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.UNPROCESSABLE_ENTITY, StatusCodes.UNPROCESSABLE_ENTITY, message);

		Object.setPrototypeOf(this, UnprocessableEntity.prototype);
	}
}

class InternalServerError extends ApiError {
	constructor(message: string, name?: string) {
		super(name || ReasonPhrases.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR, message);

		Object.setPrototypeOf(this, InternalServerError.prototype);
	}
}

export {
	ApiError,
	BadRequest,
	Unauthorized,
	Forbidden,
	Conflict,
	NotFound,
	UnprocessableEntity,
	InternalServerError
};

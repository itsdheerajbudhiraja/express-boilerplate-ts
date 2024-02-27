import type { Request, Response, NextFunction } from "express";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

import { failureResponse } from "../responses/failureResponse.js";
import { successResponse } from "../responses/successResponse.js";

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
	res.OK = function OK(result?: object | string) {
		this.status(StatusCodes.OK).send(successResponse(result || "OK"));
	};
	res.CREATED = function CREATED(result?: object | string) {
		this.status(StatusCodes.CREATED).send(successResponse(result || "CREATED"));
	};
	res.SUCCESS = function SUCCESS(result: object | string, code: number) {
		this.status(code).send(successResponse(result));
	};
	res.BAD_REQUEST = function BAD_REQUEST(message?: string) {
		this.status(StatusCodes.BAD_REQUEST).send(
			failureResponse(message || ReasonPhrases.BAD_REQUEST)
		);
	};
	res.UNAUTHORIZED = function UNAUTHORIZED(message?: string) {
		this.status(StatusCodes.UNAUTHORIZED).send(
			failureResponse(message || ReasonPhrases.UNAUTHORIZED)
		);
	};
	res.FORBIDDEN = function FORBIDDEN(message?: string) {
		this.status(StatusCodes.FORBIDDEN).send(failureResponse(message || ReasonPhrases.FORBIDDEN));
	};
	res.NOT_FOUND = function NOT_FOUND(message?: string) {
		this.status(StatusCodes.NOT_FOUND).send(failureResponse(message || ReasonPhrases.NOT_FOUND));
	};
	res.CONFLICT = function CONFLICT(message?: string) {
		this.status(StatusCodes.CONFLICT).send(failureResponse(message || ReasonPhrases.CONFLICT));
	};
	res.UNPROCESSABLE_ENTITY = function UNPROCESSABLE_ENTITY(message?: string) {
		this.status(StatusCodes.UNPROCESSABLE_ENTITY).send(
			failureResponse(message || ReasonPhrases.UNPROCESSABLE_ENTITY)
		);
	};
	res.INTERNAL_SERVER_ERROR = function INTERNAL_SERVER_ERROR(message?: string) {
		this.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
			failureResponse(message || ReasonPhrases.INTERNAL_SERVER_ERROR)
		);
	};
	res.FAILURE = function FAILURE(message: string, code: number) {
		this.status(code).send(failureResponse(message));
	};
	next();
}

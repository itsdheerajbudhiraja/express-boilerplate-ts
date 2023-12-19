import { Request, Response, NextFunction } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { failureResponse } from "../responses/failureResponse.js";
import { successResponse } from "../responses/successResponse.js";

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
	res.OK = async function OK(result?: object | string) {
		this.status(StatusCodes.OK).send(successResponse(result || "OK"));
	};
	res.CREATED = async function CREATED(result?: object | string) {
		this.status(StatusCodes.CREATED).send(successResponse(result || "CREATED"));
	};
	res.SUCCESS = async function SUCCESS(result: object | string, code: number) {
		this.status(code).send(successResponse(result));
	};
	res.BAD_REQUEST = async function BAD_REQUEST(message?: string) {
		this.status(StatusCodes.BAD_REQUEST).send(
			failureResponse(message || ReasonPhrases.BAD_REQUEST)
		);
	};
	res.UNAUTHORIZED = async function UNAUTHORIZED(message?: string) {
		this.status(StatusCodes.UNAUTHORIZED).send(
			failureResponse(message || ReasonPhrases.UNAUTHORIZED)
		);
	};
	res.FORBIDDEN = async function FORBIDDEN(message?: string) {
		this.status(StatusCodes.FORBIDDEN).send(failureResponse(message || ReasonPhrases.FORBIDDEN));
	};
	res.NOT_FOUND = async function NOT_FOUND(message?: string) {
		this.status(StatusCodes.NOT_FOUND).send(failureResponse(message || ReasonPhrases.NOT_FOUND));
	};
	res.CONFLICT = async function CONFLICT(message?: string) {
		this.status(StatusCodes.CONFLICT).send(failureResponse(message || ReasonPhrases.CONFLICT));
	};
	res.UNPROCESSABLE_ENTITY = async function UNPROCESSABLE_ENTITY(message?: string) {
		this.status(StatusCodes.UNPROCESSABLE_ENTITY).send(
			failureResponse(message || ReasonPhrases.UNPROCESSABLE_ENTITY)
		);
	};
	res.INTERNAL_SERVER_ERROR = async function INTERNAL_SERVER_ERROR(message?: string) {
		this.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
			failureResponse(message || ReasonPhrases.INTERNAL_SERVER_ERROR)
		);
	};
	res.FAILURE = async function FAILURE(message: string, code: number) {
		this.status(code).send(failureResponse(message));
	};
	next();
}

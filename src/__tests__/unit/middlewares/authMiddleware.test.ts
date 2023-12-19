/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import {
	ApiAuthType,
	authenticateAdminApiKey,
	authenticateDocsApiKey,
	authorize,
	expressAuthentication
} from "../../../middlewares/authMiddleware.js";
import { NextFunction, Request, Response } from "express";
import auth from "../../../auth/index.js";
import { ApiError } from "../../../errors/ApiError.js";
import { jest } from "@jest/globals";

let res = <Response>{};
const next: NextFunction = jest.fn();

const mockResponse = () => {
	const res = <Response>{};
	res.setHeader = jest.fn<any>();
	res.sendStatus = jest.fn<any>();
	res.UNAUTHORIZED = jest.fn();
	res.FORBIDDEN = jest.fn();
	return res;
};

res = mockResponse();

describe("Authentication Middleware", () => {
	describe("authorize", () => {
		describe("token not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authorize(req, res, next);
				expect(res.UNAUTHORIZED).toBeCalled();
			});
		});

		describe("invalid token passed", () => {
			const req = <Request>{
				headers: {
					authorization: "Bearer invalid.jwt.token"
				}
			};
			it(`should return ${StatusCodes.FORBIDDEN}`, () => {
				authorize(req, res, next);
				expect(res.FORBIDDEN).toBeCalled();
			});
		});

		describe("valid token passed", () => {
			it(`should not return ${StatusCodes.UNAUTHORIZED} or ${StatusCodes.FORBIDDEN}`, async () => {
				const validToken = await auth.createToken({ username: "username" });
				const req = <Request>{
					headers: {
						authorization: `Bearer ${validToken.accessToken.value}`
					}
				};
				authorize(req, res, next);
				expect(res.UNAUTHORIZED).toBeCalledTimes(0);
				expect(res.FORBIDDEN).toBeCalledTimes(0);
			});
		});
	});

	describe("authenticateDocsApiKey", () => {
		describe("api key not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authenticateDocsApiKey(req, res, next);
				expect(res.sendStatus).toBeCalled();
				expect(res.sendStatus).toBeCalledWith(StatusCodes.UNAUTHORIZED);
			});
		});

		describe("invalid api key passed", () => {
			const invalidApiKey = Buffer.from(`user:pass`).toString("base64");

			const req = <Request>{
				headers: {
					authorization: `Basic ${invalidApiKey}`
				}
			};
			it(`should return ${StatusCodes.FORBIDDEN}`, () => {
				authenticateDocsApiKey(req, res, next);
				expect(res.sendStatus).toBeCalledWith(StatusCodes.FORBIDDEN);
			});
		});

		describe("valid api key passed", () => {
			const validApiKey = Buffer.from(
				`${process.env.DOCS_USER}:${process.env.DOCS_PASSWORD}`
			).toString("base64");

			const req = <Request>{
				headers: {
					authorization: `Basic ${validApiKey}`
				}
			};
			it(`should not return ${StatusCodes.UNAUTHORIZED} or ${StatusCodes.FORBIDDEN}`, () => {
				authenticateDocsApiKey(req, res, next);
				expect(res.sendStatus).toBeCalledTimes(0);
				expect(res.FORBIDDEN).toBeCalledTimes(0);
			});
		});
	});

	describe("authenticateAdminApiKey", () => {
		describe("api key not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authenticateAdminApiKey(req, res, next);
				expect(res.UNAUTHORIZED).toBeCalled();
			});
		});

		describe("invalid api key passed", () => {
			const req = <any>{
				headers: {
					"x-api-key": "invalid.xapi.key"
				}
			};
			it(`should return ${StatusCodes.FORBIDDEN}`, () => {
				authenticateAdminApiKey(req, res, next);
				expect(res.FORBIDDEN).toBeCalled();
			});
		});

		describe("valid api key passed", () => {
			const req = <any>{
				headers: {
					"x-api-key": `${process.env.ADMIN_API_KEY}`
				}
			};
			it(`should not return ${StatusCodes.UNAUTHORIZED} or ${StatusCodes.FORBIDDEN}`, () => {
				authenticateAdminApiKey(req, res, next);
				expect(res.UNAUTHORIZED).toBeCalledTimes(0);
				expect(res.FORBIDDEN).toBeCalledTimes(0);
			});
		});
	});

	describe("expressAuthentication", () => {
		describe(`securityName: ${ApiAuthType.BEARER} token not passed`, () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, async () => {
				await expect(expressAuthentication(req, ApiAuthType.BEARER)).rejects.toBeInstanceOf(
					ApiError
				);
			});
		});

		describe(`securityName: ${ApiAuthType.BEARER} invalid token passed`, () => {
			const req = <Request>{
				headers: {
					authorization: "Bearer invalid.jwt.token"
				}
			};
			it(`should return ${StatusCodes.FORBIDDEN}`, async () => {
				await expect(expressAuthentication(req, ApiAuthType.BEARER)).rejects.toBeInstanceOf(
					ApiError
				);
			});
		});

		describe(`securityName: ${ApiAuthType.BEARER} valid token passed`, () => {
			it(`should not return ${StatusCodes.UNAUTHORIZED} or ${StatusCodes.FORBIDDEN}`, async () => {
				const validToken = await auth.createToken({ username: "username" });
				const req = <Request>{
					headers: {
						authorization: `Bearer ${validToken.accessToken.value}`
					}
				};
				await expect(expressAuthentication(req, ApiAuthType.BEARER)).resolves.toBeUndefined();
			});
		});
	});
});

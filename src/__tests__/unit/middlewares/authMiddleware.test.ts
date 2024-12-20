/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";

import { jest } from "@jest/globals";
import { StatusCodes } from "http-status-codes";

import auth from "../../../auth/index.js";
import { ApiError } from "../../../errors/ApiError.js";
import {
	ApiAuthType,
	authenticateAdminApiKey,
	authenticateDocsApiKey,
	authorize,
	expressAuthentication
} from "../../../middlewares/authMiddleware.js";

let res = <Response>{};
const next: NextFunction = jest.fn();

const mockResponse = () => {
	const resp = <Response>{};
	resp.setHeader = jest.fn<any>();
	resp.sendStatus = jest.fn<any>();
	resp.UNAUTHORIZED = jest.fn();
	resp.FORBIDDEN = jest.fn();
	return resp;
};

res = mockResponse();

describe("Authentication Middleware", () => {
	describe("authorize", () => {
		describe("token not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authorize(req, res, next);
				expect(res.UNAUTHORIZED).toHaveBeenCalled();
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
				expect(res.FORBIDDEN).toHaveBeenCalled();
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
				expect(res.UNAUTHORIZED).toHaveBeenCalledTimes(0);
				expect(res.FORBIDDEN).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("authenticateDocsApiKey", () => {
		describe("api key not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authenticateDocsApiKey(req, res, next);
				expect(res.sendStatus).toHaveBeenCalled();
				expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
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
				expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
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
				expect(res.sendStatus).toHaveBeenCalledTimes(0);
				expect(res.FORBIDDEN).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("authenticateAdminApiKey", () => {
		describe("api key not passed", () => {
			const req = <Request>{ headers: {} };
			it(`should return ${StatusCodes.UNAUTHORIZED}`, () => {
				authenticateAdminApiKey(req, res, next);
				expect(res.UNAUTHORIZED).toHaveBeenCalled();
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
				expect(res.FORBIDDEN).toHaveBeenCalled();
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
				expect(res.UNAUTHORIZED).toHaveBeenCalledTimes(0);
				expect(res.FORBIDDEN).toHaveBeenCalledTimes(0);
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

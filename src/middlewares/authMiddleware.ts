import type { NextFunction, Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import auth from "../auth/index.js";
import { Failure } from "../constants.js";
import { Forbidden, Unauthorized } from "../errors/ApiError.js";
import { logger } from "../winston_logger.js";

export function authorize(req: Request, res: Response, next: NextFunction) {
	try {
		if (!process.env.USE_BEARER_AUTH) {
			return next();
		}
		const { authorization } = req.headers;
		const authenticationScheme = auth.getAuthenticationScheme();
		let token;
		if (authorization && authorization.startsWith(authenticationScheme)) {
			token = authorization.split(" ")[1];
		} else if (req.cookies?.accessToken) {
			token = req.cookies.accessToken;
		}
		if (!token) {
			return res.UNAUTHORIZED("Missing authorization headers in request");
		}
		const authPayload = auth.validateToken(token);
		logger.debug("Auth payload: %o", authPayload);
		//TODO: custom payload validation here
		next();
	} catch (err) {
		logger.error("Error in authorize middleware: %o", err);
		return res.FORBIDDEN(`Authentication Failed`);
	}
}

/**
 * Docs API key authentication middleware
 */
export function authenticateDocsApiKey(req: Request, res: Response, next: NextFunction) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			res.setHeader("WWW-Authenticate", 'Basic realm="Node"');
			return res.sendStatus(StatusCodes.UNAUTHORIZED);
		}
		const base64 = authorizationHeader.split("Basic ");
		const credentials = Buffer.from(base64[1], "base64").toString();
		if (!credentials) {
			res.setHeader("WWW-Authenticate", 'Basic realm="Node"');
			return res.sendStatus(StatusCodes.UNAUTHORIZED);
		}

		const [name, pass] = credentials.split(":");

		if (!name || !pass || name !== process.env.DOCS_USER || pass !== process.env.DOCS_PASSWORD) {
			res.setHeader("WWW-Authenticate", 'Basic realm="AUTHORIZATION_REQUIRED_FOR_THIS_PAGE"');
			return res.sendStatus(StatusCodes.FORBIDDEN);
		}
		next();
	} catch (err) {
		logger.error("Error occurred in authenticateDocsApiKey middleware: %o", err);
		return res.FORBIDDEN(`Authentication Failed`);
	}
}

/**
 * X-API-KEY authentication middleware for CRUD operations
 */
export function authenticateAdminApiKey(req: Request, res: Response, next: NextFunction) {
	try {
		if (!process.env.USE_API_KEY_AUTH) {
			return next();
		}
		const apiKey = req.headers["x-api-key"];

		if (!apiKey) {
			return res.UNAUTHORIZED("Missing authorization headers in request");
		}

		if (apiKey != process.env.ADMIN_API_KEY) {
			return res.FORBIDDEN(`Authentication Failed`);
		}
		next();
	} catch (err) {
		logger.error("Error occurred in authenticateAdminApiKey middleware: %o", err);
		return res.status(StatusCodes.FORBIDDEN).send({
			status: Failure,
			message: `Error validating supplied credentials`
		});
	}
}

export async function expressAuthentication(
	req: Request,
	securityName: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	scopes?: string[]
): Promise<void> {
	try {
		if (securityName == ApiAuthType.API_KEY) {
			if (!process.env.USE_API_KEY_AUTH) {
				return Promise.resolve();
			}
			const apiKey = req.headers["x-api-key"];
			if (!apiKey) {
				return Promise.reject(new Unauthorized("Missing authorization headers in request"));
			}
			if (apiKey != process.env.ADMIN_API_KEY) {
				return Promise.reject(new Forbidden(`Authentication Failed`));
			}
			return Promise.resolve();
		}
		if (securityName == ApiAuthType.BEARER) {
			if (!process.env.USE_BEARER_AUTH) {
				return Promise.resolve();
			}
			const { authorization } = req.headers;
			const authenticationScheme = auth.getAuthenticationScheme();
			let token;
			if (authorization && authorization.startsWith(authenticationScheme)) {
				token = authorization.split(" ")[1];
			} else if (req.cookies?.accessToken) {
				token = req.cookies.accessToken;
			}
			if (!token) {
				return Promise.reject(new Unauthorized("Missing authorization headers in request"));
			}
			const authPayload = auth.validateToken(token);
			logger.debug("Auth payload: %o", authPayload);
			//TODO: custom payload validation here
			return Promise.resolve();
		}
		return Promise.reject(new Unauthorized("Unsupported_Authentication"));
	} catch (error) {
		return Promise.reject(new Forbidden("Authentication Failed"));
	}
}

export const ApiAuthType = {
	API_KEY: "apiKey",
	BEARER: "bearerAuth"
};

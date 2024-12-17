import type { NextFunction, Request, Response } from "express";
import type { IncomingHttpHeaders } from "http";
import type { JwtPayload } from "jsonwebtoken";

import { parse } from "cookie";
import { StatusCodes } from "http-status-codes";
import Jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

import auth from "../auth/index.js";
import { Failure } from "../constants.js";
import { Forbidden, Unauthorized } from "../errors/ApiError.js";
import { logger } from "../winston_logger.js";

let loginTokenSigningKey: string;

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
		} else if (req.cookies.accessToken) {
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

/**
 * End User websocket handshake authentication middleware
 */
export async function authenticateWebsocketConnectionForEndUser(
	id: string,
	headers: IncomingHttpHeaders
) {
	if (!process.env.USE_WEBSOCKET_AUTH) {
		return Promise.resolve();
	}
	let payload;
	const token = getAuthorizationTokenFromHeader("end_user", headers);

	try {
		payload = Jwt.verify(token, await getSigningKey()) as JwtPayload;
	} catch (err) {
		throw new Forbidden((err as Error).message);
	}

	if (!id || payload["role"] != "END_USER" || payload["user_id"] != id) {
		throw new Forbidden("Invalid authentication headers");
	}
	return Promise.resolve();
}

/**
 * Admin User websocket handshake authentication middleware
 */
export async function authenticateWebsocketConnectionForAdminUser(
	id: string,
	headers: IncomingHttpHeaders
) {
	if (!process.env.USE_WEBSOCKET_AUTH) {
		return Promise.resolve();
	}

	let payload;
	const token = getAuthorizationTokenFromHeader("admin_user", headers);
	try {
		payload = Jwt.verify(token, await getSigningKey()) as JwtPayload;
	} catch (err) {
		throw new Forbidden((err as Error).message);
	}

	if (!id || payload["role"] != "ADMIN_USER") {
		throw new Forbidden("Invalid authentication headers");
	}
	return Promise.resolve();
}

/**
 *
 * @param headers Request headers containing Authorization or Cookie
 * @returns login token
 */
export function getAuthorizationTokenFromHeader(type: UserType, headers: IncomingHttpHeaders) {
	if (!headers.authorization && !headers.cookie) {
		throw new Unauthorized("Missing authorization headers in request");
	}
	// getting authorization token from cookie header
	let token: string = "";

	if (headers.authorization) {
		token = headers.authorization.split("Bearer ")[1];
	} else if (headers.cookie) {
		const cookies = parse(headers.cookie);

		//extracting login_token from authorization token
		const keyForChunkCount = getCookieName("login_token_chunks_count", type);

		const chunkCounts = Number(cookies[keyForChunkCount]);
		if (isNaN(chunkCounts)) {
			throw new Unauthorized("Missing or malformed cookie");
		}

		for (let i = 0; i < chunkCounts; i++) {
			const loginTokenKey = getCookieName(`login_token_${i + 1}`, type);

			if (!cookies[loginTokenKey]) {
				throw new Unauthorized("Missing or malformed cookie");
			}
			token = token + cookies[loginTokenKey];
		}
	}
	if (!token) {
		throw new Unauthorized("Missing or malformed token");
	}
	return token;
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
			} else if (req.cookies.accessToken) {
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
		logger.error("Error occurred in expressAuthentication %o", error);
		return Promise.reject(new Forbidden("Authentication Failed"));
	}
}

export type UserType = "admin_user" | "end_user";

export function getCookieName(name: string, userType: UserType) {
	name = `${name}_${userType}`;
	return process.env.COOKIES_NAME_SUFFIX ? `${name}${process.env.COOKIES_NAME_SUFFIX}` : name;
}

/**
 *
 * @returns Public signing key from Jwks
 */
async function getSigningKey() {
	try {
		if (loginTokenSigningKey) {
			//returning cached signingKey
			return loginTokenSigningKey;
		}

		const client = jwksClient({
			jwksUri: `${process.env.LOGIN_SERVICE_BASE_URL}${process.env.LOGIN_JWKS_ENDPOINT}`,
			timeout: 30000
		});

		const key = await client.getSigningKey();
		const signingKey = key.getPublicKey();

		//caching signing key
		loginTokenSigningKey = signingKey;

		return loginTokenSigningKey;
	} catch (err) {
		logger.error("Error occurred in getSigningKey: %o", err);
		throw err;
	}
}

export const ApiAuthType = {
	API_KEY: "apiKey",
	BEARER: "bearerAuth"
};

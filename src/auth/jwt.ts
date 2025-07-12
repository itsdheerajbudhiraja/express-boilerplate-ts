import type AuthInterface from "./AuthInterface.js";
import type { AccessToken, JwtConstructorOptions, RefreshToken, Token } from "./types.js";
import type { SignOptions, VerifyOptions, Algorithm } from "jsonwebtoken";
import type { StringValue } from "ms";

import crypto, { createPublicKey, createHash, type JsonWebKey } from "crypto";
import jwt from "jsonwebtoken";

import { REFRESH_TOKENS_COLLECTION } from "../constants.js";
import { db } from "../db/index.js";
import { parseDuration } from "../utils/parseDuration.js";
import { logger } from "../winston_logger.js";

import { AuthenticationScheme } from "./types.js";

class JWT implements AuthInterface {
	private privateKey: string;
	private publicKey: string;
	private privateJwks: JsonWebKey;
	private publicJwks: JsonWebKey;
	private kid: string | undefined;
	private authenticationScheme: AuthenticationScheme;
	private algorithm: Algorithm;
	private expiryTime: StringValue | number;
	private refreshTokenExpiryTime: string | number;
	private audiences: string | string[];
	private issuer: string;

	private signOptions: SignOptions;
	private verifyOptions: VerifyOptions;

	/**
	 * JWT constructor to initialize JWT options
	 */
	constructor(options?: JwtConstructorOptions) {
		try {
			this.privateKey = options?.privateKey || process.env.PRIVATE_PEM_KEY;
			this.publicKey = options?.publicKey || process.env.PUBLIC_PEM_KEY;

			this.privateJwks = createPublicKey(this.privateKey).export({ format: "jwk" });
			this.publicJwks = createPublicKey(this.publicKey).export({ format: "jwk" });
			this.kid = this.calculateKid(this.publicJwks);
			this.publicJwks.kid = this.kid;

			this.authenticationScheme = AuthenticationScheme[process.env.AUTHENTICATION_SCHEME];
			this.algorithm = process.env.JWT_ALGORITHM;

			this.expiryTime = options?.expiryTime || process.env.JWT_EXPIRY_TIME;
			this.refreshTokenExpiryTime =
				options?.refreshTokenExpiryTime || process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME;
			this.audiences = options?.audiences || process.env.JWT_AUDIENCES;
			this.issuer = options?.issuer || process.env.JWT_ISSUER;

			this.signOptions = {
				expiresIn: this.expiryTime,
				algorithm: this.algorithm,
				audience: this.audiences,
				issuer: this.issuer,
				...options?.signInOptions
			};
			this.verifyOptions = {
				algorithms: [this.algorithm],
				...options?.verifyOptions
			};
		} catch (err) {
			logger.error("Error occurred while executing JWT constructor: %o", err);
			process.exit(1);
		}
	}

	/**
	 * Creates signed JWT token for specified claims
	 */
	async createToken(data: object, refresh = false, previousRefreshToken = "null"): Promise<Token> {
		try {
			const accessTokenValue = jwt.sign(data, this.privateKey, {
				...this.signOptions,
				keyid: this.kid
			});
			const accessToken: AccessToken = {
				value: accessTokenValue,
				created_at: new Date(),
				expiration_time: new Date(new Date().getTime() + parseDuration(this.expiryTime))
			};

			if (refresh) {
				const refreshToken: RefreshToken = {
					value: crypto.randomBytes(128).toString("base64url"),
					user_id: (data as { user_id: string })["user_id"],
					access_token: accessToken.value,
					previous_refresh_token: previousRefreshToken,
					created_at: new Date(),
					expiration_time: new Date(
						new Date().getTime() + parseDuration(this.refreshTokenExpiryTime)
					)
				};

				await db.insertOne<RefreshToken>(REFRESH_TOKENS_COLLECTION, refreshToken);

				return {
					accessToken: accessToken,
					refreshToken: refreshToken
				};
			}

			return {
				accessToken: accessToken
			};
		} catch (err) {
			logger.error("Error occurred while creating JWT: %o", err);
			throw err;
		}
	}

	/**
	 * Validates the JWT token signature using public key
	 */
	validateToken(token: string, ignoreExpiration?: boolean): string | jwt.Jwt | jwt.JwtPayload {
		try {
			this.verifyOptions.ignoreExpiration = ignoreExpiration ?? this.verifyOptions.ignoreExpiration;

			const verifiedResponse = jwt.verify(token, this.publicKey, this.verifyOptions);
			return verifiedResponse;
		} catch (err) {
			logger.error("Error occurred in validateToken %o", err);
			throw err;
		}
	}

	/**
	 * Returns the JWT authentication scheme initialized for JWT
	 */
	getAuthenticationScheme() {
		return this.authenticationScheme;
	}

	/**
	 * Returns private key in json web key format
	 */
	getPrivateJwks() {
		return this.privateJwks;
	}

	/**
	 * Returns public key in json web key format
	 */
	getPublicJwks() {
		return this.publicJwks;
	}

	/**
	 * Calculates kid for key
	 */
	calculateKid(jwk: JsonWebKey) {
		let components;

		switch (jwk.kty) {
			case "RSA":
				components = {
					e: jwk.e,
					kty: "RSA",
					n: jwk.n
				};
				break;
			case "EC":
				components = {
					crv: jwk.crv,
					kty: "EC",
					x: jwk.x,
					y: jwk.y
				};
				break;
			case "OKP":
				components = {
					crv: jwk.crv,
					kty: "OKP",
					x: jwk.x
				};
				break;
			default:
				return undefined;
		}

		return createHash("sha256").update(JSON.stringify(components)).digest().toString("base64url");
	}
}

export default JWT;

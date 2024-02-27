import type AuthInterface from "./AuthInterface.js";
import type { AccessToken, JwtConstructorOptions, RefreshToken, Token } from "./types.js";
import type { SignOptions, VerifyOptions, Algorithm } from "jsonwebtoken";

import crypto, { createPublicKey } from "crypto";
import { existsSync, readFileSync } from "fs";
import jwt from "jsonwebtoken";
import path from "path";

import { REFRESH_TOKENS_COLLECTION } from "../constants.js";
import { db } from "../db/index.js";
import { dirName } from "../utils/fileDirName.js";
import { parseDuration } from "../utils/parseDuration.js";
import { logger } from "../winston_logger.js";

import { AuthenticationScheme } from "./types.js";

class JWT implements AuthInterface {
	private keyDirectoryPath: string;
	private privateKeyFile: string;
	private publicKeyFile: string;
	private privateKey: string;
	private publicKey: string;
	private authenticationScheme: AuthenticationScheme;
	private algorithm: Algorithm;
	private expiryTime: string | number;
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
			this.keyDirectoryPath =
				options?.keyDirectoryPath ||
				(process.env.KEY_PAIR_DIRECTORY
					? "../../" + process.env.KEY_PAIR_DIRECTORY
					: "../../keys/");
			this.privateKeyFile =
				options?.privateKeyFile || process.env.PRIVATE_KEY_FILE || "privateKey.pem";
			this.publicKeyFile = options?.publicKeyFile || process.env.PUBLIC_KEY_FILE || "publicKey.pem";
			const privateKeyPath = path.join(
				dirName(import.meta),
				this.keyDirectoryPath,
				this.privateKeyFile
			);
			if (existsSync(privateKeyPath)) {
				this.privateKey = readFileSync(privateKeyPath).toString("utf-8");
			} else {
				throw new Error(
					"Private key doesn't exists at specified path: " +
						privateKeyPath +
						" Specify correct path in .env using 'KEY_PAIR_DIRECTORY' and 'PRIVATE_KEY_FILE' parameters or else place private key at: " +
						privateKeyPath
				);
			}
			const publicKeyPath = path.join(
				dirName(import.meta),
				this.keyDirectoryPath,
				this.publicKeyFile
			);
			if (existsSync(publicKeyPath)) {
				this.publicKey = readFileSync(publicKeyPath).toString("utf-8");
			} else {
				throw new Error(
					"Public key doesn't exists at specified path: " +
						publicKeyPath +
						" Specify correct path in .env using 'KEY_PAIR_DIRECTORY' and 'PUBLIC_KEY_FILE' parameters or else place public key at: " +
						publicKeyPath
				);
			}

			if (process.env.AUTHENTICATION_SCHEME) {
				if (process.env.AUTHENTICATION_SCHEME in AuthenticationScheme) {
					this.authenticationScheme =
						AuthenticationScheme[process.env.AUTHENTICATION_SCHEME as AuthenticationScheme];
				} else {
					throw new Error(
						`Supplied AUTHENTICATION_SCHEME ${
							process.env.AUTHENTICATION_SCHEME
						} in .env is not supported, It can be one of:
							${JSON.stringify(Object.keys(AuthenticationScheme))}`
					);
				}
			} else {
				this.authenticationScheme = AuthenticationScheme.Bearer;
			}
			const supportedAlgos = [
				"HS256",
				"HS384",
				"HS512",
				"RS256",
				"RS384",
				"RS512",
				"ES256",
				"ES384",
				"ES512",
				"PS256",
				"PS384",
				"PS512",
				"none"
			];
			if (process.env.JWT_ALGORITHM) {
				if (supportedAlgos.indexOf(process.env.JWT_ALGORITHM) !== -1) {
					this.algorithm = process.env.JWT_ALGORITHM as Algorithm;
				} else {
					throw new Error(
						`Supplied JWT_ALGORITHM ${
							process.env.JWT_ALGORITHM
						} in .env not supported. It can be one of following: ${JSON.stringify(supportedAlgos)}`
					);
				}
			} else {
				this.algorithm = "RS256";
			}
			this.expiryTime = options?.expiryTime || process.env.JWT_EXPIRY_TIME || "1h";
			this.refreshTokenExpiryTime =
				options?.refreshTokenExpiryTime || process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME || "7d";
			this.audiences = options?.audiences || process.env.JWT_AUDIENCES || "VC_AUTHN_OIDC";
			this.issuer = options?.issuer || process.env.JWT_ISSUER || "VC_AUTHN_OIDC_ISSUER";

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
			const accessTokenValue = jwt.sign(data, this.privateKey, this.signOptions);
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

	createJwks() {
		const publicJWKS = createPublicKey(this.publicKey).export({ format: "jwk" });

		return {
			keys: [publicJWKS]
		};
	}
}

export default JWT;

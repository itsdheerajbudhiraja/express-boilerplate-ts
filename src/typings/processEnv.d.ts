import type { AuthenticationScheme } from "../auth/types.ts";
import type { Algorithm } from "jsonwebtoken";
import type { tags } from "typia";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			[key: string]: string | undefined;

			// Express Server
			NODE_ENV: string;
			HOST: string;
			PORT: number & tags.Minimum<80> & tags.Maximum<30000>;
			HTTPS: boolean;
			SSL_CRT_FILE?: string;
			SSL_KEY_FILE?: string;
			TRUST_PROXY: boolean;
			CORS_ORIGIN: string[];
			LOG_LEVEL_CONSOLE: "debug" | "info" | "warn" | "error";
			LOG_LEVEL_FILE: "silly" | "debug" | "info" | "warn" | "error";

			// DOCS Authentication
			DOCS_API_KEY: string & tags.MinLength<10>;
			DOCS_USER: string;
			DOCS_PASSWORD: string & tags.MinLength<10>;
			EXPOSE_SWAGGER_DOCS: boolean;
			AUTHENTICATE_SWAGGER_DOCS: boolean;
			EXPOSE_TYPE_DOCS: boolean;
			AUTHENTICATE_TYPE_DOCS: boolean;
			EXPOSE_TEST_REPORTS: boolean;
			AUTHENTICATE_TEST_REPORTS: boolean;

			// APIs Authentication
			ADMIN_API_KEY: string & tags.MinLength<10>;

			// Disable auth when handled on API GW
			USE_BEARER_AUTH: boolean;
			USE_API_KEY_AUTH: boolean;

			// Swagger
			SWAGGER_BASE_URL: string;
			UPDATE_SWAGGER_ON_START: boolean;

			// Database
			DB_TYPE: "MongoDb";
			DB_CONNECTION_STRING: string & tags.Format<"uri">;
			DB_ENCRYPT_DATA: boolean;
			DB_ENCRYPTION_VAULT_COLLECTION: "encryption.__keyVault";
			DB_ENCRYPTION_LOCAL_KEY: string & tags.MinLength<192> & tags.MaxLength<192>;
			DB_ENCRYPTION_ALGORITHM:
				| "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
				| "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
				| "Indexed"
				| "Unindexed"
				| "RangePreview";

			// Persistent Queue
			PERSISTENT_QUEUE_TYPE: "Redis";
			PERSISTENT_QUEUE_URL: string & tags.Format<"uri">;
			QUEUE_PREFIX: string;

			// For redis queue type
			REDIS_CLUSTER_MODE: boolean;

			// Cache
			CACHE_TYPE: "NodeCache";
			CACHE_STANDARD_TTL: number;
			CACHE_EXPIRED_CHECK_PERIOD: number;

			// Auth
			AUTH_TYPE: "JWT";
			JWT_ALGORITHM: Algorithm;
			JWT_EXPIRY_TIME: string;
			JWT_REFRESH_TOKEN_EXPIRY_TIME: string;
			JWT_AUDIENCES: string;
			JWT_ISSUER: string;
			AUTHENTICATION_SCHEME: keyof typeof AuthenticationScheme;
			KEY_PAIR_DIRECTORY: string;
			PRIVATE_KEY_FILE: string;
			PUBLIC_KEY_FILE: string;

			// Banner
			APPLICATION_TITLE: string;
			APPLICATION_DESCRIPTION: string;
			APPLICATION_TITLE_COLOR: string;
			APPLICATION_DESCRIPTION_COLOR: string;

			// Email validation TLDS
			EMAIL_VALIDATOR_ADDITIONAL_TLDS: string[];
			EMAIL_VALIDATOR_ADDITIONAL_SLDS: string[];
			EMAIL_VALIDATOR_ADDITIONAL_DOMAINS: string[];
		}
	}
}

export {};

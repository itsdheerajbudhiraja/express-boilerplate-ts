import type { AuthenticationScheme } from "../auth/types.ts";
import type { Algorithm } from "jsonwebtoken";
import type { StringValue } from "ms";
import type { tags } from "typia";

declare global {
	namespace NodeJS {
		type TruthyString = string & tags.MinLength<1>;

		interface ProcessEnv {
			[key: string]: string | undefined;

			// Express Server
			NODE_ENV: TruthyString;
			HOST: TruthyString;
			PORT: number & tags.Minimum<80> & tags.Maximum<30000>;
			ENABLE_WEBSOCKET_SERVER: boolean;
			HTTPS: boolean;
			SSL_CRT_FILE?: string;
			SSL_KEY_FILE?: string;
			TRUST_PROXY: boolean;
			CORS_ORIGIN: string[];
			LOG_LEVEL_CONSOLE: "debug" | "info" | "warn" | "error";
			LOG_LEVEL_FILE: "silly" | "debug" | "info" | "warn" | "error";
			RATE_LIMIT_WINDOW_MS: number;
			RATE_LIMIT_MAX_REQUESTS: number;

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
			USE_WEBSOCKET_AUTH: boolean;

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
				| "Unindexed";

			// Persistent Queue
			PERSISTENT_QUEUE_TYPE: "Redis";
			PERSISTENT_QUEUE_URL: string & tags.Format<"uri">;
			QUEUE_PREFIX: string;

			// For redis queue type
			REDIS_CLUSTER_MODE: boolean;

			// Cache
			CACHE_TYPE: "NodeCache" | "RedisCache";
			CACHE_STANDARD_TTL: number;
			CACHE_EXPIRED_CHECK_PERIOD: number;
			CACHE_SERVER_URL?: string & tags.Format<"uri">;

			// Websocket Notification
			NOTIFICATION_QUEUE: string;

			// Auth
			AUTH_TYPE: "JWT";
			JWT_ALGORITHM: Algorithm;
			JWT_EXPIRY_TIME: StringValue | number;
			JWT_REFRESH_TOKEN_EXPIRY_TIME: StringValue | number;
			JWT_AUDIENCES: string;
			JWT_ISSUER: string;
			AUTHENTICATION_SCHEME: keyof typeof AuthenticationScheme;
			PRIVATE_PEM_KEY: TruthyString;
			PUBLIC_PEM_KEY: TruthyString;

			// Banner
			APPLICATION_TITLE: TruthyString;
			APPLICATION_DESCRIPTION: TruthyString;
			APPLICATION_TITLE_COLOR: TruthyString;
			APPLICATION_DESCRIPTION_COLOR: TruthyString;

			// Scripts
			SCRIPT_SERVER_BASE_URL: string & tags.Pattern<"^(http|https)://">;
			SCRIPT_SERVER_API_KEY: string;

			// Email validation TLDS
			EMAIL_VALIDATOR_ADDITIONAL_TLDS: string[];
			EMAIL_VALIDATOR_ADDITIONAL_SLDS: string[];
			EMAIL_VALIDATOR_ADDITIONAL_DOMAINS: string[];

			//SMTP
			SMTP_HOST: TruthyString;
			SMTP_PORT: number;
			SMTP_USERNAME: TruthyString;
			SMTP_PASS: TruthyString;
			SMTP_SENDER_NAME: TruthyString;
			SMTP_SENDER_EMAIL: TruthyString;

			// AWS S3 configs
			AWS_REGION: TruthyString;
			AWS_ACCESS_ID: TruthyString;
			AWS_ACCESS_KEY: TruthyString;
			AWS_S3_BUCKET_NAME: TruthyString;
			AWS_S3_ENCRYPT_DOCUMENTS: boolean;
			AWS_S3_ENCRYPTION_KEY: TruthyString;
			AWS_S3_ENCRYPTED_DOCUMENT_DOWNLOAD_BASE_URL: TruthyString & tags.Format<"uri">;
			AWS_S3_ENCRYPTED_DOCUMENT_DOWNLOAD_HMAC_SECRET_KEY: TruthyString;

			// Document Image Size Limits
			DOCUMENT_GENERAL_MAX_SIZE: number & tags.Type<"uint32"> & tags.Maximum<4096>;
			DOCUMENT_JPEG_MAX_SIZE: number & tags.Type<"uint32"> & tags.Maximum<4096>;
			DOCUMENT_PNG_MAX_SIZE: number & tags.Type<"uint32"> & tags.Maximum<4096>;
			DOCUMENT_PDF_MAX_SIZE: number & tags.Type<"uint32"> & tags.Maximum<4096>;

			//* Other Components configurations like Dedicated Login Service etc

			// Login service
			COOKIES_DOMAIN: string;
			COOKIES_NAME_SUFFIX: string;
			LOGIN_JWKS_ENDPOINT: string;
			LOGIN_SERVICE_BASE_URL: string;
		}
	}
}

export {};

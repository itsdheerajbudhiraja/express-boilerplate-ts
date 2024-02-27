declare global {
	namespace NodeJS {
		interface ProcessEnv {
			[key: string]: string | undefined;

			PORT: number;
			HTTPS: boolean;
			TRUST_PROXY: boolean;

			EXPOSE_SWAGGER_DOCS: boolean;
			AUTHENTICATE_SWAGGER_DOCS: boolean;
			EXPOSE_TYPE_DOCS: boolean;
			AUTHENTICATE_TYPE_DOCS: boolean;
			EXPOSE_TEST_REPORTS: boolean;
			AUTHENTICATE_TEST_REPORTS: boolean;

			USE_BEARER_AUTH: boolean;
			USE_API_KEY_AUTH: boolean;

			UPDATE_SWAGGER_ON_START: boolean;
		}
	}
}

export {};

declare namespace Express {
	export interface Response {
		OK(result?: object | string): void;
		CREATED(result?: object | string): void;
		SUCCESS(result: object | string, code: number): void;
		BAD_REQUEST(message?: string): void;
		UNAUTHORIZED(message?: string): void;
		FORBIDDEN(message?: string): void;
		NOT_FOUND(message?: string): void;
		CONFLICT(message?: string): void;
		UNPROCESSABLE_ENTITY(message?: string): void;
		INTERNAL_SERVER_ERROR(message?: string): void;
		FAILURE(message: string, code: number): void;
	}
}

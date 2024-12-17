import type { User } from "../entities/User.ts";
import type { UploadedDocument } from "../types/User.ts";

declare global {
	namespace Express {
		export interface Request {
			swaggerDoc: object;
			user: User;
			documents?: UploadedDocument[];
		}
	}
}

export {};

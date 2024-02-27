import type { User } from "../entities/User.ts";

/* eslint-disable */
declare global {
	namespace Express {
		export interface Request {
			swaggerDoc: object;
			user: User;
		}
	}
}

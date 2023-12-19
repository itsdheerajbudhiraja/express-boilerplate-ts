import { Token } from "./types.js";

/* eslint-disable */
interface AuthInterface {
	createToken: (data: object, refresh: boolean) => Promise<Token>;
	validateToken: (token: string) => any;
	refreshToken?: (oldToken: string, refreshToken: string) => Token;
	getAlgorithm?: () => any;
	getAuthenticationScheme: () => any;
}

export default AuthInterface;

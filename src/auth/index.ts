import { logger } from "../winston_logger.js";

import JWT from "./jwt.js";
// Other auth imports here after implementation

const authTypes = {
	JWT: JWT
	// other auth types here
};

const auth_type = process.env.AUTH_TYPE as string;

if (!(auth_type in authTypes)) {
	logger.error("Unsupported AUTH_TYPE: %o", auth_type);
	process.exit(1);
}

const authInstance = new authTypes[auth_type as keyof typeof authTypes]();

export default authInstance;

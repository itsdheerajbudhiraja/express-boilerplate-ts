import JWT from "./jwt.js";
// Other auth imports here after implementation
const supportedAuth = new Map();

type authTypes = {
	JWT: JWT;
	// other auth types here
};

supportedAuth.set("JWT", new JWT());
// other auth types here

const auth_type = process.env.AUTH_TYPE as string;

function auth<T extends keyof authTypes>(auth_type: string): authTypes[T] {
	return supportedAuth.get(auth_type) as authTypes[T];
}

export default auth(auth_type);

import { SignOptions, VerifyOptions } from "jsonwebtoken";

enum AuthenticationScheme {
	"Basic" = "Basic",
	"Bearer" = "Bearer",
	"Digest" = "Digest",
	"HOBA" = "HOBA",
	"Mutual" = "Mutual",
	"Negotiate" = "Negotiate",
	"VAPID" = "VAPID",
	"SCRAM" = "SCRAM",
	"AWS4-HMAC-SHA256" = "AWS4-HMAC-SHA256"
}

type AccessToken = {
	value: string;
	created_at: string;
	expiration_time: string;
} & { [key: string]: string | number | object };
type RefreshToken = {
	value: string;
	created_at: string;
	expiration_time: string;
	access_token: string;
	previous_refresh_token: string;
} & { [key: string]: string | number | object };

type Token = {
	accessToken: AccessToken;
	refreshToken?: RefreshToken;
};

type JwtConstructorOptions = {
	signInOptions?: SignOptions;
	verifyOptions?: VerifyOptions;
	keyDirectoryPath?: string;
	privateKeyFile?: string;
	publicKeyFile?: string;
	audiences?: string | string[];
	expiryTime?: string | number;
	refreshTokenExpiryTime?: string | number;
	issuer?: string;
};

export { AuthenticationScheme, JwtConstructorOptions, Token, AccessToken, RefreshToken };

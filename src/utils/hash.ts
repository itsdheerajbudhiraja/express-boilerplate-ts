import crypto from "crypto";

export function createSha256Hash(data: string) {
	return crypto.createHash("sha256").update(data).digest("hex");
}

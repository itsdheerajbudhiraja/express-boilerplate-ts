import { User } from "../entities/User.js";

export const ENCRYPTION_CONFIG = {
	[User.collectionName]: {
		includeFields: <string[]>[],
		excludeFields: <string[]>[],
		includeAutoDeleteFields: <string[]>[],
		excludeAutoDeleteFields: <string[]>[],
		auto_encrypt: false
	}
};

export const CLIENT_ENCRYPTION_CONFIG = {
	keyVaultNamespace: process.env.DB_ENCRYPTION_VAULT_COLLECTION as string,
	kmsProviders: {
		local: {
			key: Buffer.alloc(96, Buffer.from(process.env.DB_ENCRYPTION_LOCAL_KEY as string, "hex"))
		}
	}
};

export const CLIENT_ENCRYPTION_ALGORITHM = (process.env.DB_ENCRYPTION_ALGORITHM ||
	"AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic") as
	| "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic"
	| "AEAD_AES_256_CBC_HMAC_SHA_512-Random"
	| "Indexed"
	| "Unindexed"
	| "RangePreview";

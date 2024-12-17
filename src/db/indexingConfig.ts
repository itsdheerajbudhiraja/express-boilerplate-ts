import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { REFRESH_TOKENS_COLLECTION } from "../constants.js";
import { User } from "../entities/User.js";

type IndexConfig = {
	[key: string]: {
		name: string;
		spec: IndexSpecification;
		options?: CreateIndexesOptions;
	}[];
};

export const INDEXING_CONFIG: IndexConfig = {
	[REFRESH_TOKENS_COLLECTION]: [
		{
			name: "value",
			spec: { value: -1 },
			options: { unique: true }
		},
		{
			name: "user_id",
			spec: { user_id: 1 }
		},
		{
			name: "value_user_id",
			spec: { value: -1, user_id: 1 },
			options: { unique: true }
		},
		{
			name: "expiration_time",
			spec: { expiration_time: -1 },
			options: { expireAfterSeconds: 0 }
		}
	],
	[User.collectionName]: [
		{
			name: "name",
			spec: { name: 1 }
		}
	]
};

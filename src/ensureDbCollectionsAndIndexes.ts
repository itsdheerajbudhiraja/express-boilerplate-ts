import { ClientEncryption, ClientEncryptionCreateDataKeyProviderOptions } from "mongodb";
import { db } from "./db/index.js";
import { logger } from "./winston_logger.js";
import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { CLIENT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIG } from "./db/encryptionConfig.js";
import { REFRESH_TOKENS_COLLECTION } from "./constants.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { dirName } from "./utils/fileDirName.js";
import { EntityCollectionUndefinedError } from "./errors/EntityCollectionUndefinedError.js";
import { BaseEntity } from "./entities/BaseEntity.js";

const ensureDbCollectionsAndIndexes = async function ensureDbCollectionsAndIndexes() {
	// Ensure all entity class have collection name defined.
	await ensureEntitiesCollectionNameDefined();

	await ensureCollectionAndIndex(
		REFRESH_TOKENS_COLLECTION,
		"value",
		{ value: -1 },
		{ unique: true }
	);
	await ensureCollectionAndIndex(REFRESH_TOKENS_COLLECTION, "user_id", { user_id: 1 }, {});
	await ensureCollectionAndIndex(
		REFRESH_TOKENS_COLLECTION,
		"value_user_id",
		{ value: -1, user_id: 1 },
		{ unique: true }
	);
	await ensureCollectionAndIndex(
		REFRESH_TOKENS_COLLECTION,
		"expiration_time",
		{ expiration_time: -1 },
		{ expireAfterSeconds: 0 }
	);
};

async function ensureCollectionAndIndex(
	collectionName: string,
	indexName: string,
	indexSpec: IndexSpecification,
	options: CreateIndexesOptions = {}
) {
	try {
		const collection = db.mongoClient.db(db.dbName).collection(collectionName);

		if (
			(await db.mongoClient.db(db.dbName).listCollections({ name: collectionName }).toArray())
				.length == 0
		) {
			await db.mongoClient.db(db.dbName).createCollection(collectionName);
		}

		if (!(await collection.indexExists(indexName))) {
			logger.info("Creating index on %o", collectionName);
			await collection.createIndex(indexSpec, { name: indexName, ...options });
		} else {
			logger.info("Index already exists on %o", collectionName);
		}
	} catch (err) {
		logger.error("Error occurred in ensureCollectionAndIndex: %o", err);
		throw err;
	}
}

/**
 * Ensures Encryption Keys on Database
 */
async function ensureEncryptionKeys() {
	const client = db.mongoClient;
	try {
		if (process.env.DB_ENCRYPT_DATA) {
			const encryption = new ClientEncryption(client, CLIENT_ENCRYPTION_CONFIG);

			await Promise.all(
				Object.keys(ENCRYPTION_CONFIG).map(async (collectionName) => {
					const dataKeyProviderOptions: ClientEncryptionCreateDataKeyProviderOptions = {
						keyAltNames: [collectionName]
					};
					const result = await encryption.getKeyByAltName(collectionName);

					if (result) {
						logger.info("Encryption key already exists for %s", collectionName);
					} else {
						await encryption.createDataKey("local", dataKeyProviderOptions);
						logger.info("Encryption key created and stored for %s ", collectionName);
					}
				})
			);
		}
	} catch (err) {
		logger.error("Error occurred in ensureKeyCollection : %o", err);
		throw err;
	}
}

async function ensureEntitiesCollectionNameDefined() {
	const entities = await readdir(join(dirName(import.meta), "./entities"));
	const entitiesPromises = entities.map(async (entity) => {
		let entityClass = await import(join(dirName(import.meta), "./entities", entity));
		entityClass = entityClass[Object.keys(entityClass)[0]];

		if (entity !== "BaseEntity.js") {
			if (!(Object.getPrototypeOf(entityClass) == BaseEntity)) {
				throw new EntityCollectionUndefinedError(
					`${entityClass.name} class declared in ${entity} doesn't extend 'BaseEntity'. All Classes in 'entities' folder should extend 'BaseEntity' except 'BaseEntity'`
				);
			}
			if (entityClass.collectionName == undefined) {
				throw new EntityCollectionUndefinedError(
					`Collection name is not initialized for Entity: ${entityClass.name} which extends BaseEntity`
				);
			}
		}
	});
	await Promise.all(entitiesPromises);
}

export { ensureDbCollectionsAndIndexes, ensureEncryptionKeys };

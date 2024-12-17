import type {
	ClientEncryptionCreateDataKeyProviderOptions,
	CreateIndexesOptions,
	IndexSpecification
} from "mongodb";

import { readdir } from "fs/promises";
import { ClientEncryption } from "mongodb";
import { join } from "path";

import { REFRESH_TOKENS_COLLECTION } from "./constants.js";
import { CLIENT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIG } from "./db/encryptionConfig.js";
import { db } from "./db/index.js";
import { INDEXING_CONFIG } from "./db/indexingConfig.js";
import { BaseEntity } from "./entities/BaseEntity.js";
import { EntityCollectionUndefinedError } from "./errors/EntityCollectionUndefinedError.js";
import { dirName } from "./utils/fileDirName.js";
import { logger } from "./winston_logger.js";

const ensureDbCollectionsAndIndexes = async function ensureDbCollectionsAndIndexes() {
	// Ensure all entity class have collection name defined.
	await ensureEntitiesCollectionNameDefined();

	await Promise.all(
		Object.keys(INDEXING_CONFIG).map(async (collectionName) => {
			const indexes = INDEXING_CONFIG[collectionName];

			for (const config of indexes) {
				await ensureCollectionAndIndex(collectionName, config.name, config.spec, config.options);
			}

			if (collectionName != REFRESH_TOKENS_COLLECTION) {
				await ensureCollectionAndIndex(collectionName, "created_at", { created_at: -1 });
				await ensureCollectionAndIndex(collectionName, "updated_at", { updated_at: -1 });
			}
		})
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
	const files = await readdir(join(dirName(import.meta), "./entities"));
	const entities = files.filter((file) => file.match(".js$"));
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

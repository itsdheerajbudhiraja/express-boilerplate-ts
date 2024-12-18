import type DbInterface from "./DbInterface.js";
import type {
	AggregateOptions,
	Binary,
	BulkWriteOptions,
	CountDocumentsOptions,
	DeleteOptions,
	Document,
	Filter,
	FindOneAndDeleteOptions,
	FindOneAndReplaceOptions,
	FindOneAndUpdateOptions,
	FindOptions,
	InsertManyResult,
	InsertOneOptions,
	InsertOneResult,
	OptionalUnlessRequiredId,
	Sort,
	UpdateFilter,
	UpdateOptions,
	WithId,
	WithoutId
} from "mongodb";

import lodash from "lodash";
import { MongoClient, ClientEncryption } from "mongodb";

import { isObjectOrArray } from "../utils/checkType.js";
import { getObjectKeysMatchingWildcard } from "../utils/getObjectKeysMatchingWildcard.js";
import { isStringEmail } from "../utils/isStringEmail.js";
import { logger } from "../winston_logger.js";

import {
	CLIENT_ENCRYPTION_ALGORITHM,
	CLIENT_ENCRYPTION_CONFIG,
	ENCRYPTION_CONFIG
} from "./encryptionConfig.js";

const { cloneDeep, get, set, size, has } = lodash;

class MongoDb implements DbInterface<MongoDb> {
	private static instance: MongoDb | undefined;

	mongoClient = <MongoClient>{};
	dbName = "";
	connection_string = "";
	clientEncryption: ClientEncryption;

	constructor(connection_string: string) {
		MongoDb.instance = this;
		this.connection_string = connection_string;
		this.mongoClient = new MongoClient(connection_string, {
			autoEncryption: { bypassAutoEncryption: true, ...CLIENT_ENCRYPTION_CONFIG }
		});
		this.dbName = this.mongoClient.options.dbName;
		this.clientEncryption = new ClientEncryption(this.mongoClient, CLIENT_ENCRYPTION_CONFIG);
	}

	static getInstance() {
		return MongoDb.instance;
	}

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.mongoClient
				.connect()
				.then((client) => {
					this.mongoClient = client;
					logger.info(
						"Mongo db connected to srv %o with database %o",
						this.connection_string,
						client.options.dbName
					);
					return resolve();
				})
				.catch((err) => {
					logger.error("Error occurred while connecting to mongodb: %o", err);
					return reject(err);
				});
		});
	}

	async disconnect(): Promise<void> {
		try {
			await this.mongoClient.close();
		} catch (err) {
			logger.error("Error occurred when closing the mongo db connection %o", err);
		}
	}

	/**
	 * Get mongo collection
	 * @param {string} collectionName - Name of collection
	 * @returns Collection of documents
	 *  */
	getCollection<T extends Document>(collectionName: string) {
		try {
			const db = this.mongoClient.db(this.dbName);
			const collection = db.collection<T>(collectionName);
			return collection;
		} catch (err) {
			logger.error("Error occurred in getCollection: %o", err);
			throw err;
		}
	}

	/**
	 * Insert one document into mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {OptionalUnlessRequiredId<T extends Document>} data - Document to insert
	 * @param {InsertOneOptions} options - Optional settings for the command
	 */
	async insertOne<T extends Document>(
		collectionName: string,
		data: OptionalUnlessRequiredId<T>,
		options: InsertOneOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const collectionEncryptionConfig =
				collectionName in ENCRYPTION_CONFIG &&
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG];

			let r: InsertOneResult<T>;
			if (collectionEncryptionConfig) {
				let dataToInsert = cloneDeep(data);

				dataToInsert = await this.encrypt(collectionName, dataToInsert);
				r = await collection.insertOne(dataToInsert, options);
			} else {
				r = await collection.insertOne(data, options);
			}

			logger.debug(
				"Inserted %o documents into the collection %o, inserted id : %o",
				1,
				collectionName,
				r.insertedId
			);
			return r;
		} catch (err) {
			logger.error("Error occurred in insertOne: %o", err);
			throw err;
		}
	}

	/**
	 * Insert many documents into mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Array<OptionalUnlessRequiredId<T extends Document>>} data - Document to insert
	 * @param {object} options - Optional settings for the command
	 */
	async insertMany<T extends Document>(
		collectionName: string,
		data: OptionalUnlessRequiredId<T>[],
		options: BulkWriteOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const collectionEncryptionConfig =
				collectionName in ENCRYPTION_CONFIG &&
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG];

			let r: InsertManyResult<T>;
			if (collectionEncryptionConfig) {
				let dataToInsert = cloneDeep(data);

				logger.debug("Starting encryption for %o records", data.length);
				dataToInsert = await Promise.all(
					dataToInsert.map(async (record) => {
						const encryptedData = await this.encrypt(collectionName, record);
						return encryptedData;
					})
				);
				logger.debug("Completed encryption for %o records", data.length);

				r = await collection.insertMany(dataToInsert, options);
			} else {
				r = await collection.insertMany(data, options);
			}

			logger.debug("Inserted %o documents into the collection %o", r.insertedCount, collectionName);
			return r;
		} catch (err) {
			logger.error("Error occurred in insertMany: %o", err);
			throw err;
		}
	}

	/**
	 * Update one document in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Filter condition to filer document
	 * @param {UpdateFilter<T extends Document>} data - Document to update
	 * @param {UpdateOptions} options - Optional settings for the command
	 */
	async updateOne<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		data: UpdateFilter<T> | Partial<T>,
		options: UpdateOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.updateOne(filterCondition, data, options);

			logger.debug("Updated %o documents into the collection %o", r.modifiedCount, collectionName);
			return r;
		} catch (err) {
			logger.error("Error occurred in updateOne: %o", err);
			throw err;
		}
	}

	/**
	 * Update many documents in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Filter condition to filer documents
	 * @param {UpdateFilter<T extends Document>} data - Documents to update
	 * @param {UpdateOptions} options - Optional settings for the command
	 */
	async updateMany<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		data: UpdateFilter<T> | Partial<T>,
		options: UpdateOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.updateMany(filterCondition, data, options);

			logger.debug("Updated %o documents into the collection %o", r.modifiedCount, collectionName);
			return r;
		} catch (err) {
			logger.error("Error occurred in updateMany: %o", err);
			throw err;
		}
	}

	/**
	 * Deletes one document in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter document to delete
	 * @param {DeleteOptions} options - Optional settings for the command
	 */
	async deleteOne<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		options: DeleteOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.deleteOne(filterCondition, options);

			logger.debug("Deleted %o documents into the collection %o", r.deletedCount, collectionName);
			return r;
		} catch (err) {
			logger.error("Error occurred in deleteOne: %o", err);
			throw err;
		}
	}

	/**
	 * Deletes many document in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter documents to delete
	 * @param {DeleteOptions} options - Optional settings for the command
	 */
	async deleteMany<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		options: DeleteOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.deleteMany(filterCondition, options);

			logger.debug("Deleted %o documents into the collection %o", r.deletedCount, collectionName);
			return r;
		} catch (err) {
			logger.error("Error occurred in deleteMany: %o", err);
			throw err;
		}
	}

	/**
	 * Find one document in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter document to find
	 * @param {FindOptions<T extends Document>} options - Optional settings for the command
	 */
	async findOne<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		options: FindOptions<T> = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.findOne(filterCondition, {
				...options
			});

			logger.debug("Found %o document in the collection %o", r ? 1 : 0, collectionName);

			r && this.recursiveDecode(r);

			return r;
		} catch (err) {
			logger.error("Error occurred in findOne: %o", err);
			throw err;
		}
	}

	/**
	 * Find one document and update in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter document to find and update
	 * @param {Document} data - Updated Document
	 * @param {UpdateFilter<T extends Document>} options - Optional settings for the command
	 */
	async findOneAndUpdate<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		data: UpdateFilter<T>,
		options: FindOneAndUpdateOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.findOneAndUpdate(filterCondition, data, {
				returnDocument: "after",
				upsert: true,
				...options
			});

			logger.debug(
				"Find and Updated 1 document into the collection %o for Id %o",
				collectionName,
				r?._id
			);

			r && this.recursiveDecode(r);

			return r as T;
		} catch (err) {
			logger.error("Error occurred in findOneAndUpdate: %o", err);
			throw err;
		}
	}

	/**
	 * Find one document and delete in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter document to find and delete
	 * @param {FindOneAndDeleteOptions} options - Optional settings for the command
	 */
	async findOneAndDelete<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		options: FindOneAndDeleteOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.findOneAndDelete(filterCondition, { ...options });

			logger.debug("Find and deleted document into the collection : %o", JSON.stringify(r));

			r && this.recursiveDecode(r);
			return r;
		} catch (err) {
			logger.error("Error occurred in findOneAndDelete: %o", err);
			throw err;
		}
	}

	/**
	 * Find one document and replace in mongo collection
	 * @param {string} collectionName - Name of collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter document to find and replace
	 * @param {WithoutId<T>} data - New Document
	 * @param {FindOneAndReplaceOptions} options - Optional settings for the command
	 */
	async findOneAndReplace<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		data: WithoutId<T>,
		options: FindOneAndReplaceOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection.findOneAndReplace(filterCondition, data, {
				returnDocument: "after",
				upsert: true,
				...options
			});

			logger.debug("Found and replaced document into the collection : %o", JSON.stringify(r));

			r && this.recursiveDecode(r);

			return r as T;
		} catch (err) {
			logger.error("Error occurred in findOneAndReplace: %o", err);
			throw err;
		}
	}

	/**
	 * Return mongo cursor for collection
	 * @param {string} collectionName - Name of Collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter documents
	 * @param {FindOptions<T extends Document>} options - Find options
	 */
	findCursor<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T>,
		options: FindOptions<T> = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = collection.find(filterCondition, options);
			return r;
		} catch (err) {
			logger.error("Error occurred in find: %o", err);
			throw err;
		}
	}

	/**
	 * Fetch count of documents in collection for specified filter criteria
	 * @param {string} collectionName - Name of Collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter documents
	 * @param {CountDocumentsOptions} countOptions - Find options
	 */
	async countDocuments<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T> = {},
		countOptions: CountDocumentsOptions = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const count = await collection.countDocuments(filterCondition, countOptions);

			return count;
		} catch (err) {
			logger.error("Error occurred in countDocuments: %o", err);
			throw err;
		}
	}

	/**
	 * Fetch all documents collection
	 * @param {string} collectionName - Name of Collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter documents
	 * @param {number} skip - No of documents to skip
	 * @param {number} limit - No of documents to return at once.
	 * @param {FindOptions<T extends Document>} findOptions - Find options
	 */
	async fetchAll<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T> = {},
		skip = 0,
		limit = 100,
		findOptions: FindOptions<T> = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection
				.find(filterCondition, findOptions)
				.skip(skip)
				.limit(limit)
				.toArray();
			const count = await collection.countDocuments(filterCondition);
			logger.debug("Found %o documents in the collection %o", r.length, collectionName);

			this.recursiveDecode(r);

			return { content: r, total_elements: count };
		} catch (err) {
			logger.error("Error occurred in fetchAll: %o", err);
			throw err;
		}
	}

	/**
	 * Fetch all documents collection
	 * @param {string} collectionName - Name of Collection
	 * @param {Filter<T extends Document>} filterCondition - Condition to filter documents
	 * @param {Sort} sortCriteria - Sort criteria
	 * @param {number} skip - No of documents to skip
	 * @param {number} limit - No of documents to return at once.
	 * @param {FindOptions<T extends Document>} findOptions - Find options
	 */
	async fetchAllAndSort<T extends Document>(
		collectionName: string,
		filterCondition: Filter<T> = {},
		sortCriteria: Sort,
		skip = 0,
		limit = 100,
		findOptions: FindOptions<T> = {}
	) {
		try {
			const collection = this.getCollection<T>(collectionName);
			const r = await collection
				.find(filterCondition, findOptions)
				.skip(skip)
				.sort(sortCriteria)
				.limit(limit)
				.toArray();
			const count = await collection.countDocuments(filterCondition);

			logger.debug("Found %o documents in the collection %o", r.length, collectionName);

			this.recursiveDecode(r);

			return { content: r, total_elements: count };
		} catch (err) {
			logger.error("Error occurred in fetchAllAndSort: %o", err);
			throw err;
		}
	}

	/**
	 *
	 */
	async aggregate<T>(collectionName: string, pipeline: Document[], options?: AggregateOptions) {
		const collection = this.getCollection(collectionName);
		const r = await collection.aggregate(pipeline, options).toArray();

		this.recursiveDecode(r);

		return r as T[];
	}

	/**
	 * Encrypts data based of ENCRYPTION_CONFIG
	 * @param collectionName - Name of Collection to retrieve key from encryption vault
	 * @param data - Data to Encrypt
	 */
	async encrypt<T>(collectionName: string, data: OptionalUnlessRequiredId<T>) {
		try {
			if (!process.env.DB_ENCRYPT_DATA) {
				return data;
			}

			const collectionEncryptionConfig =
				collectionName in ENCRYPTION_CONFIG &&
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG];

			if (!collectionEncryptionConfig) {
				return data;
			}

			const includeFields =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].includeFields;
			const excludeFields =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].excludeFields;
			const autoEncrypt =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].auto_encrypt;

			const dataToEncrypt = cloneDeep(data);

			const dataToReturn = cloneDeep(data);
			delete dataToEncrypt["_id"];

			if (includeFields.length && autoEncrypt) {
				await Promise.all(
					includeFields.map(async (key) => {
						await this.encryptAndMaskValue(key, collectionName, data, dataToEncrypt, dataToReturn);
					})
				);
			} else if (excludeFields.length && autoEncrypt) {
				await Promise.all(
					Object.keys(dataToEncrypt).map(async (key) => {
						if (excludeFields.indexOf(key) == -1) {
							await this.encryptAndMaskValue(
								key,
								collectionName,
								data,
								dataToEncrypt,
								dataToReturn
							);
						}
					})
				);
			} else if (autoEncrypt) {
				await Promise.all(
					Object.keys(dataToEncrypt).map(async (key) => {
						await this.encryptAndMaskValue(key, collectionName, data, dataToEncrypt, dataToReturn);
					})
				);
			}

			return dataToReturn;
		} catch (err) {
			logger.error("Error occurred in encrypt: %o", err);
			throw err;
		}
	}

	/**
	 * Encrypts Value
	 * @param collectionName - Name of Collection to retrieve key from encryption vault
	 * @param value - Value to encrypt
	 */
	async encryptValue(collectionName: string, value: string | number | object) {
		try {
			if (!process.env.DB_ENCRYPT_DATA) {
				return value;
			}

			const collectionEncryptionConfig =
				collectionName in ENCRYPTION_CONFIG &&
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG];

			if (!collectionEncryptionConfig) {
				return value;
			}

			const encryptedValue = await this.clientEncryption.encrypt(this.encodeValue(value), {
				keyAltName: collectionName,
				algorithm: CLIENT_ENCRYPTION_ALGORITHM
			});

			return encryptedValue;
		} catch (err) {
			logger.error("Error occurred in encrypting value: %o in encryptValue: %o", value, err);
			throw err;
		}
	}

	private async recursiveEncrypt(collectionName: string, obj: object, path?: string[]) {
		try {
			const objToEncrypt = path ? get(obj, path) : obj;
			await Promise.all(
				Object.entries(objToEncrypt).map(async ([key, value]) => {
					if (value != null) {
						let pathToEncrypt = [key];

						if (path) {
							pathToEncrypt = [...path, ...pathToEncrypt];
						}

						if (isObjectOrArray(value as object)) {
							await this.recursiveEncrypt(collectionName, obj, pathToEncrypt);
						} else {
							set(obj, pathToEncrypt, await this.encryptValue(collectionName, value as string));
						}
					}
				})
			);
		} catch (err) {
			logger.error("Error occurred in encrypting object: %o in recursiveEncrypt: %o", obj, err);
			throw err;
		}
	}

	private async encryptForKey<T>(
		collectionName: string,
		key: string,
		dataToEncrypt: object,
		dataToReturn: object
	) {
		try {
			if (!process.env.DB_ENCRYPT_DATA) {
				return dataToEncrypt;
			}
			const valueToEncrypt = get(dataToEncrypt, key.split(".")) as object | undefined;
			let encryptedValue;
			if (valueToEncrypt != null) {
				if (isObjectOrArray(valueToEncrypt)) {
					await this.recursiveEncrypt(collectionName, valueToEncrypt);
					encryptedValue = valueToEncrypt;
				} else {
					encryptedValue = await this.encryptValue(collectionName, valueToEncrypt);
				}
				set(
					dataToReturn,
					key.split("."),
					encryptedValue as OptionalUnlessRequiredId<T>[keyof OptionalUnlessRequiredId<T>]
				);
			}
		} catch (err) {
			logger.error("Error occurred in encryptForKey: %o", err);
			throw err;
		}
	}

	private async encryptAndMaskValue<T>(
		key: string,
		collectionName: string,
		data: OptionalUnlessRequiredId<T>,
		dataToEncrypt: OptionalUnlessRequiredId<T>,
		dataToReturn: OptionalUnlessRequiredId<T>
	) {
		if (key.includes("*")) {
			const keys = getObjectKeysMatchingWildcard(data, key);
			return await Promise.all(
				keys.map(async (newKey) => {
					await this.encryptAndMaskValue(newKey, collectionName, data, dataToEncrypt, dataToReturn);
				})
			);
		}

		if (!has(dataToReturn, ["original_attributes", key])) {
			await this.encryptForKey<T>(collectionName, key, dataToEncrypt, dataToReturn);
		}
		if (
			data["data_masking_required" as keyof typeof data] &&
			key != "original_attributes" &&
			!has(dataToReturn, ["original_attributes", key])
		) {
			const original_attributes_keys = ["original_attributes"];
			original_attributes_keys.push(...key.split("."));
			set(dataToReturn, original_attributes_keys, get(dataToReturn, key.split(".")));

			const value = get(dataToEncrypt, key.split(".")) as string;
			if (isStringEmail(value)) {
				set(
					dataToReturn,
					key.split("."),
					"*".repeat(size(value.split("@")[0])) + "@" + value.split("@")[1]
				);
			} else {
				set(dataToReturn, key.split("."), "*".repeat(size(value)));
			}
		}
	}

	/**
	 * Decrypts based of Encryption_Config
	 * @param collectionName - Name of Collection
	 * @param data - Data to Decrypt
	 */
	async decrypt<T>(collectionName: string, data: OptionalUnlessRequiredId<T> | WithId<T>) {
		try {
			if (!process.env.DB_ENCRYPT_DATA) {
				return data;
			}

			const collectionEncryptionConfig =
				collectionName in ENCRYPTION_CONFIG &&
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG];

			if (!collectionEncryptionConfig) {
				return data;
			}

			const includeFields =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].includeFields;
			const excludeFields =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].excludeFields;
			const autoDecrypt =
				ENCRYPTION_CONFIG[collectionName as keyof typeof ENCRYPTION_CONFIG].auto_encrypt;

			const dataToDecrypt = cloneDeep(data);
			delete dataToDecrypt["_id"];

			if (includeFields.length && autoDecrypt) {
				await Promise.all(
					includeFields.map(async (key) => {
						await this.decryptForKey<T>(key, dataToDecrypt, data);
					})
				);
			} else if (excludeFields.length && autoDecrypt) {
				await Promise.all(
					Object.keys(dataToDecrypt).map(async (key) => {
						if (excludeFields.indexOf(key) == -1) {
							await this.decryptForKey<T>(key, dataToDecrypt, data);
						}
					})
				);
			} else if (autoDecrypt) {
				await Promise.all(
					Object.keys(dataToDecrypt).map(async (key) => {
						await this.decryptForKey<T>(key, dataToDecrypt, data);
					})
				);
			}
			return data;
		} catch (err) {
			logger.error("Error occurred in decrypt: %o", err);
			throw err;
		}
	}

	/**
	 * Decrypts Value
	 * @param value - Value to Decrypt
	 */
	async decryptValue(value: Binary) {
		try {
			if (!process.env.DB_ENCRYPT_DATA) {
				return value;
			}

			if ((value as unknown as object).constructor.name != "Binary") {
				return value;
			}

			const decryptedValue = await this.clientEncryption.decrypt(value);
			const decodedValue = this.decodeValue(decryptedValue);

			return decodedValue;
		} catch (err) {
			logger.error("Error occurred in decryptValue: %o", err);
			throw err;
		}
	}

	private async recursiveDecrypt(obj: object, path?: string[]) {
		try {
			const objToDecrypt = path ? get(obj, path) : obj;
			await Promise.all(
				Object.entries(objToDecrypt).map(async ([key, value]) => {
					if (value != null) {
						let pathToDecrypt = [key];

						if (path) {
							pathToDecrypt = [...path, ...pathToDecrypt];
						}

						if (isObjectOrArray(value as object)) {
							await this.recursiveDecrypt(obj, pathToDecrypt);
						} else {
							set(obj, pathToDecrypt, await this.decryptValue(value as Binary));
						}
					}
				})
			);
		} catch (err) {
			logger.error("Error occurred in recursiveDecrypt: %o", err);
			throw err;
		}
	}

	private async decryptForKey<T>(key: string, dataToDecrypt: object, data: object) {
		try {
			if (key.includes("*")) {
				const keys = getObjectKeysMatchingWildcard(data, key);
				return await Promise.all(
					keys.map(async (newKey) => {
						await this.decryptForKey(newKey, dataToDecrypt, data);
					})
				);
			}
			const valueToDecrypt = get(dataToDecrypt, key.split(".")) as object | undefined;
			let decryptedValue;
			if (valueToDecrypt != null) {
				if (isObjectOrArray(valueToDecrypt)) {
					await this.recursiveDecrypt(valueToDecrypt);
					decryptedValue = valueToDecrypt;
				} else {
					decryptedValue = await this.decryptValue(valueToDecrypt as Binary);
				}
				set(
					data,
					key.split("."),
					decryptedValue as OptionalUnlessRequiredId<T>[keyof OptionalUnlessRequiredId<T>]
				);
			}
		} catch (err) {
			logger.error("Error occurred in decryptForKey: %o", err);
			throw err;
		}
	}

	private encodeValue(value: string | number | object) {
		switch (typeof value) {
			case "number":
				return `n:${value}`;

			case "boolean":
				return `b:${value}`;

			default:
				return value;
		}
	}

	private decodeValue(encodedData: string) {
		if (typeof encodedData != "string" || encodedData[1] != ":") {
			return encodedData;
		}
		const type = encodedData.substring(0, 2);
		const value = encodedData.substring(2);
		switch (type) {
			case "n:":
				return Number(value);
			case "b:":
				return value === "true";
			default:
				return value;
		}
	}

	private recursiveDecode(obj: object, path?: string[]) {
		try {
			const objToDecrypt = path ? get(obj, path) : obj;

			Object.entries(objToDecrypt).map(([key, value]) => {
				if (value != null) {
					let pathToDecrypt = [key];

					if (path) {
						pathToDecrypt = [...path, ...pathToDecrypt];
					}

					if (isObjectOrArray(value as object)) {
						this.recursiveDecode(obj, pathToDecrypt);
					} else {
						set(obj, pathToDecrypt, this.decodeValue(value as string));
					}
				}
			});
		} catch (err) {
			logger.error("Error occurred in recursiveDecode: %o", err);
			throw err;
		}
	}
}

export default MongoDb;

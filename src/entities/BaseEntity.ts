import type { UUIDv4 } from "../types/Common.js";
import type { Filter, FindOptions, OptionalUnlessRequiredId } from "mongodb";

import { v4 } from "uuid";

import { ENCRYPTION_CONFIG } from "../db/encryptionConfig.js";
import { db } from "../db/index.js";
import { logger } from "../winston_logger.js";

export class BaseEntity {
	static collectionName: string;

	_id?: UUIDv4;
	created_at?: Date;
	updated_at?: Date;

	static async save<T extends BaseEntity>(entity: T) {
		if (Object.hasOwn(ENCRYPTION_CONFIG, this.collectionName)) {
			logger.debug(
				"Encryption is enabled for collection name: %o in base entity",
				this.collectionName
			);
			entity = (await db.encrypt(this.collectionName, entity as BaseEntity)) as T;
		}
		entity._id = entity._id || v4();
		entity.updated_at = new Date();
		const createdAt = entity.created_at || new Date();
		delete entity["created_at"];
		const saveResult = await db.findOneAndUpdate<T>(
			this.collectionName,

			{ _id: entity._id as Filter<T>["_id"] },
			{
				$set: entity,
				$setOnInsert: { created_at: createdAt } as Readonly<Partial<T>>
			},
			{
				upsert: true
			}
		);
		return saveResult;
	}

	static async getById<T extends BaseEntity>(_id: Filter<T>["_id"]) {
		return await db.findOne<T>(this.collectionName, { _id: _id });
	}

	static async getAll<T extends BaseEntity>(
		skip?: number,
		limit?: number,
		findOptions?: FindOptions
	) {
		return await db.fetchAll<T>(this.collectionName, {}, skip, limit, findOptions);
	}

	static async findOne<T extends BaseEntity>(query: Filter<T>, findOptions?: FindOptions) {
		if (Object.hasOwn(ENCRYPTION_CONFIG, this.collectionName)) {
			logger.debug(
				"Encryption is enabled for collection name: %o in base entity findOne",
				this.collectionName
			);
			query = (await db.encrypt(this.collectionName, query as object)) as Filter<T>;
		}
		return await db.findOne<T>(this.collectionName, query, findOptions);
	}

	static async filterByQuery<T extends BaseEntity>(
		query: Filter<T>,
		skip?: number,
		limit?: number,
		findOptions?: FindOptions
	) {
		if (Object.hasOwn(ENCRYPTION_CONFIG, this.collectionName)) {
			query = (await db.encrypt(
				this.collectionName,
				query as object
			)) as OptionalUnlessRequiredId<T>;
		}
		return await db.fetchAll<T>(this.collectionName, query, skip, limit, findOptions);
	}

	static async deleteById<T extends BaseEntity>(_id: Filter<T>["_id"]): Promise<boolean> {
		const existingData = await this.getById<T>(_id);

		let deleteResult;

		if (existingData) {
			await db.insertOne<T>(this.collectionName, existingData as OptionalUnlessRequiredId<T>);

			deleteResult = await db.deleteOne<T>(this.collectionName, {
				_id: _id
			});
		}

		return deleteResult?.deletedCount == 1;
	}

	static addDateQueryToFilterQuery<T, P extends { from_date?: Date; to_date?: Date }>(
		filterQuery: Filter<T>,
		searchParams: P
	) {
		const dateQuery = { $and: [] as unknown as { created_at: object }[] };
		if (searchParams.from_date) {
			dateQuery.$and.push({ created_at: { $gte: new Date(searchParams.from_date) } });
			delete filterQuery["from_date" as keyof typeof filterQuery];
		}
		if (searchParams.to_date) {
			dateQuery.$and.push({ created_at: { $lt: new Date(searchParams.to_date) } });
			delete filterQuery["to_date" as keyof typeof filterQuery];
		}
		if (dateQuery.$and.length) {
			filterQuery["$and"] = dateQuery.$and;
		}
	}

	static async unsetFields<T extends BaseEntity>(filterQuery: Filter<T>, fields: (keyof T)[]) {
		return await db.aggregate<T>(
			this.collectionName,
			[
				{
					$match: filterQuery
				},
				{
					$unset: fields
				}
			],
			{ allowDiskUse: true }
		);
	}
}

import type { UUIDv4 } from "../types/Common.js";
import type { Document, Filter, FindOptions } from "mongodb";

import { ObjectId } from "mongodb";

import { db } from "../db/index.js";

class BaseEntity {
	static collectionName: string;

	_id?: UUIDv4;

	static async save<T extends BaseEntity | Document>(entity: T) {
		const saveResult = await db.findOneAndUpdate<T>(
			this.collectionName,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			{ _id: entity._id || new ObjectId() },
			{ $set: entity },
			{
				upsert: true
			}
		);
		return saveResult;
	}

	static async getById<T extends BaseEntity | Document>(_id: T["_id"]) {
		return await db.findOne<T>(this.collectionName, { _id: _id });
	}

	static async getAll<T extends BaseEntity | Document>(
		skip?: number,
		limit?: number,
		findOptions?: FindOptions
	) {
		return await db.fetchAll<T>(this.collectionName, {}, skip, limit, findOptions);
	}

	static async filterByQuery<T extends BaseEntity | Document>(
		query: Filter<T>,
		skip?: number,
		limit?: number,
		findOptions?: FindOptions
	) {
		return await db.fetchAll<T>(this.collectionName, query, skip, limit, findOptions);
	}

	static async deleteById<T extends BaseEntity | Document>(_id: T["_id"]): Promise<boolean> {
		//? TODO: save into different collection for archiving
		const deleteResult = await db.deleteOne<T>(this.collectionName, { _id: _id });
		return deleteResult.deletedCount == 1;
	}
}

export { BaseEntity };

import { Document, Filter, ObjectId } from "mongodb";
import { db } from "../db/index.js";

class BaseEntity {
	static collectionName: string;

	_id?: string | number | ObjectId | undefined;

	static async save<T extends BaseEntity | Document>(entity: T) {
		await db.findOneAndUpdate<T>(
			this.collectionName,
			{ _id: entity._id || new ObjectId() },
			{ $set: entity },
			{
				upsert: true
			}
		);
		return entity;
	}

	static async getById<T extends BaseEntity | Document>(_id: T["_id"]) {
		return await db.findOne<T>(this.collectionName, { _id: _id });
	}

	static async getAll<T extends BaseEntity | Document>(skip?: number, limit?: number) {
		return await db.fetchAll<T>(this.collectionName, {}, skip, limit);
	}

	static async filterByQuery<T extends BaseEntity | Document>(
		query: Filter<T>,
		skip?: number,
		limit?: number
	) {
		return await db.fetchAll<T>(this.collectionName, query, skip, limit);
	}

	static async deleteById<T extends BaseEntity | Document>(_id: T["_id"]) {
		await db.deleteOne<T>(this.collectionName, { _id: _id });
	}
}

export { BaseEntity };

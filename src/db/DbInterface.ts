/* eslint-disable */
import { Document, FindCursor, WithId } from "mongodb";

interface DbInterface<T> {
	instance?: T;
	getInstance?(): T;
	connect(): Promise<any>;
	disconnect(): Promise<any>;
	insertOne(tableName: string, data: any, options: any): Promise<any>;
	insertMany(tableName: string, data: any, options: any): Promise<any>;
	updateOne(tableName: string, filterCondition: any, data: any, options: any): Promise<any>;
	updateMany(tableName: string, filterCondition: any, data: any, options: any): Promise<any>;
	deleteOne(tableName: string, filterCondition: any, options: any): Promise<any>;
	deleteMany(tableName: string, filterCondition: any, options: any): Promise<any>;
	findOne(tableName: string, filterCondition: any, options: any): Promise<any>;
	findOneAndUpdate(tableName: string, filterCondition: any, data: any, options: any): Promise<any>;
	findOneAndDelete(tableName: string, filterCondition: any, options: any): Promise<any>;
	findOneAndReplace(tableName: string, filterCondition: any, data: any, options: any): Promise<any>;
	countDocuments(tableName: string, filterCondition: any, options: any): Promise<number>;
	fetchAll(
		tableName: string,
		filterCondition: any,
		skip: number,
		limit: number,
		findOptions: any
	): Promise<{ data: any[]; total_elements: number }>;
	fetchAllAndSort(
		tableName: string,
		filterCondition: any,
		sortCriteria: any,
		skip: number,
		limit: number,
		findOptions: any
	): Promise<{ data: any[]; total_elements: number }>;
	encrypt(tableName: string, data: any): Promise<any>;
	encryptValue(tableName: string, data: any): Promise<any>;
	decrypt(tableName: string, data: any): Promise<any>;
	decryptValue(data: any): Promise<any>;

	/** findCursor is needed for mongodb like databases */
	findCursor?(tableName: string, filterCondition: any, options: any): FindCursor<WithId<Document>>;
}

export default DbInterface;

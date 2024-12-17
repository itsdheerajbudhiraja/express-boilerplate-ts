/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class AbstractAppCache {
	abstract set(key: string, value: any, ttl?: number): Promise<boolean>;
	abstract get<T>(key: string): Promise<T | undefined>;
}

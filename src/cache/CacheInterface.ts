/* eslint-disable @typescript-eslint/no-explicit-any */
interface CacheInterface<T> {
	instances?: { [key: string]: T };
	getInstance?(cacheName: string, ttl?: number, checkPeriod?: number): T;
	set(key: string, value: any, ttl?: number): any;
	get(key: string): any;
}

export { CacheInterface };

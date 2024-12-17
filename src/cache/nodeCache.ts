import * as Node_Cache from "node-cache";

import { AbstractAppCache } from "./AbstractAppCache.js";

class NodeCache extends AbstractAppCache {
	private cache: Node_Cache;
	private stdTTL: number;

	cacheName: string;

	constructor(
		cacheName: string,
		ttl = Number(process.env.CACHE_STANDARD_TTL),
		checkPeriod = Number(process.env.CACHE_EXPIRED_CHECK_PERIOD)
	) {
		super();
		this.cacheName = cacheName;
		this.cache = new Node_Cache.default({
			stdTTL: ttl,
			checkperiod: checkPeriod,
			useClones: false
		});
		this.stdTTL = ttl;
	}

	set<T>(key: string, value: T, ttl = this.stdTTL): Promise<boolean> {
		return Promise.resolve(this.cache.set<T>(`${this.cacheName}-${key}`, value, ttl));
	}

	get<T>(key: string): Promise<T | undefined> {
		const data = this.cache.get<T>(`${this.cacheName}-${key}`);
		return Promise.resolve(data);
	}
}

export { NodeCache };

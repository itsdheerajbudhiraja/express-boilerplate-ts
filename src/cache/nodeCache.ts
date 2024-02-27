import type { CacheInterface } from "./CacheInterface.js";

import * as Node_Cache from "node-cache";

class NodeCache implements CacheInterface<NodeCache> {
	private static instances: {
		[key: string]: NodeCache | undefined;
	} = {};

	cache: Node_Cache;
	stdTTL: number;

	getInstance(cacheName: string, ttl?: number, checkPeriod?: number): NodeCache {
		return NodeCache.instances[cacheName] || new NodeCache(cacheName, ttl, checkPeriod);
	}

	constructor(
		cacheName: string,
		ttl = Number(process.env.CACHE_STANDARD_TTL),
		checkPeriod = Number(process.env.CACHE_EXPIRED_CHECK_PERIOD)
	) {
		NodeCache.instances[cacheName] = this;
		this.cache = new Node_Cache.default({
			stdTTL: ttl,
			checkperiod: checkPeriod,
			useClones: false
		});
		this.stdTTL = ttl;
	}

	set(key: string, value: string | number | object, ttl = this.stdTTL): boolean {
		return this.cache.set(key, value, ttl);
	}

	get(key: string): string | number | object | undefined {
		return this.cache.get(key);
	}
}

export { NodeCache };

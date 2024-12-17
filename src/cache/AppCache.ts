import type { AbstractAppCache } from "./AbstractAppCache.js";

import { logger } from "../winston_logger.js";

import { NodeCache } from "./nodeCache.js";
import { RedisCache } from "./redis.js";

export class AppCache {
	static supportedCaches = {
		NodeCache: NodeCache,
		RedisCache: RedisCache
		// Add more supported Cache implementation here. Should be implementation of CacheInterface.ts
	};

	static cache_type = process.env.CACHE_TYPE as keyof typeof AppCache.supportedCaches;

	static {
		logger.debug("Cache type: %o", this.cache_type);

		if (!(this.cache_type in this.supportedCaches)) {
			logger.error("Unsupported CACHE_TYPE: %o", this.cache_type);
			process.exit(1);
		}
	}

	static instances: { [key: string]: AbstractAppCache | undefined } = {};

	static getInstance(cacheName: string, ttl?: number, checkPeriod?: number): AbstractAppCache {
		if (!this.instances[cacheName]) {
			this.instances[cacheName] = new AppCache.supportedCaches[AppCache.cache_type](
				cacheName,
				ttl,
				checkPeriod
			);
		}
		return this.instances[cacheName];
	}
}

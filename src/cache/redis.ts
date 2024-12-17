import type { Cluster } from "ioredis";

import { Redis as RedisClient } from "ioredis";

import { parseJsonWithDate } from "../utils/parseJsonWithDate.js";
import { logger } from "../winston_logger.js";

import { AbstractAppCache } from "./AbstractAppCache.js";

class RedisCache extends AbstractAppCache {
	static client: Cluster | RedisClient | undefined;
	static connection_string = process.env.CACHE_SERVER_URL;

	static {
		if (!this.connection_string) {
			logger.error("'CACHE_SERVER_URL' environment variable is required to use 'RedisCache'");
			process.exit(1);
		}
	}

	stdTTL: number;

	cacheName: string;

	constructor(
		cacheName: string,
		ttl = Number(process.env.CACHE_STANDARD_TTL),
		_checkPeriod = Number(process.env.CACHE_EXPIRED_CHECK_PERIOD)
	) {
		super();
		if (!RedisCache.client) {
			if (process.env.REDIS_CLUSTER_MODE) {
				RedisCache.client = new RedisClient.Cluster([RedisCache.connection_string as string]);
			} else {
				RedisCache.client = new RedisClient(RedisCache.connection_string as string);
			}
		}
		this.stdTTL = ttl;
		this.cacheName = cacheName;
	}

	async set<T>(key: string, value: T, ttl = this.stdTTL): Promise<boolean> {
		await RedisCache.client?.set(`${this.cacheName}-${key}`, JSON.stringify(value));
		await RedisCache.client?.expire(`${this.cacheName}-${key}`, ttl);
		return true;
	}

	async get<T>(key: string): Promise<T | undefined> {
		const data = await RedisCache.client?.get(`${this.cacheName}-${key}`);

		if (data) {
			return parseJsonWithDate(data);
		}

		return undefined;
	}
}

export { RedisCache };

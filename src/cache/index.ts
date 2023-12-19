import { logger } from "../winston_logger.js";
import { NodeCache } from "./nodeCache.js";
// Other Cache imports here after implementation

const supportedCaches = {
	NodeCache: NodeCache
	// Add more supported Cache implementation here. Should be implementation of CacheInterface.ts
};

const cache_type = process.env.CACHE_TYPE as keyof typeof supportedCaches;

logger.debug("Cache type: %o", cache_type);

const Cache = supportedCaches[cache_type];

export { Cache };

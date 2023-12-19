import { logger } from "../winston_logger.js";
import { Redis } from "./redis.js";
// Other Queues imports here after implementation

const supportedQueues = {
	Redis: Redis
	// Add more supported Queue implementation here. Should be implementation of QueueInterface.ts
};

const queue_type = process.env.PERSISTENT_QUEUE_TYPE as keyof typeof supportedQueues;

const persistent_queue_url =
	process.env.PERSISTENT_QUEUE_URL === undefined
		? (function () {
				logger.error("PERSISTENT_QUEUE_URL not found in environment variable");
				process.exit(1);
			})()
		: process.env.PERSISTENT_QUEUE_URL;

logger.debug("Persistent queue type: %o", queue_type);
logger.debug("Value of persistent queue connection string %o: ", persistent_queue_url);

const persistentQueueInstance =
	supportedQueues[queue_type].getInstance() ||
	new supportedQueues[queue_type](persistent_queue_url);

export { persistentQueueInstance as pQueue };

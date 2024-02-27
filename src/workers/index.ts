import type { Pool } from "workerpool";

import os from "os";
import { join } from "path";
import workerpool from "workerpool";

import { dirName } from "../utils/fileDirName.js";
import { logger } from "../winston_logger.js";

const cpuCount = os.cpus().length;

const poolMap = new Map<string, Pool>();

type PoolOptions = {
	poolSize?: number;
	maxPoolSize?: number;
	workerTerminateTimeout?: number;
};

/**
 * Creates or Retrieves worker pool based on worker file name
 * @param poolOptions
 */
function createOrGetPool({
	poolSize = cpuCount / 2,
	maxPoolSize = cpuCount - 1,
	workerTerminateTimeout = 15000
}: PoolOptions): Pool {
	try {
		if (poolMap.has("worker_pool")) {
			return poolMap.get("worker_pool") as Pool;
		} else {
			const worker_pool = workerpool.pool(join(dirName(import.meta), "./registeredWorkers.js"), {
				minWorkers: poolSize,
				workerTerminateTimeout: workerTerminateTimeout,
				maxWorkers: maxPoolSize
			});

			setInterval(() => {
				const poolStats = worker_pool.stats();
				logger.debug(
					`Stats for worker pool: \nTotal Workers: ${poolStats.totalWorkers}\nBusy Workers:${poolStats.busyWorkers}\nIdle Workers: ${poolStats.idleWorkers}\nPending tasks: ${poolStats.pendingTasks}\nActive Tasks: ${poolStats.activeTasks}`
				);
			}, 30_000);

			poolMap.set("worker_pool", worker_pool);
			return worker_pool;
		}
	} catch (err) {
		logger.error("Error initializing worker_pool");
		throw err;
	}
}
/**
 * Terminates Worker Pool
 */
async function terminatePool() {
	try {
		if (poolMap.has("worker_pool")) {
			const worker_pool = poolMap.get("worker_pool");
			await worker_pool?.terminate();
			poolMap.delete("worker_pool");
		}
	} catch (err) {
		logger.error("Error occurred in terminatePool: %o", err);
		throw err;
	}
}

export { createOrGetPool, terminatePool };

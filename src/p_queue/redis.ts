import type { QueueInterface } from "./QueueInterface.js";
import type { Cluster } from "ioredis";

import { Redis as RedisClient } from "ioredis";
import sleep from "sleep-promise";
import { v4 } from "uuid";

import { logger } from "../winston_logger.js";

class Redis implements QueueInterface<Redis> {
	private static instance: Redis | undefined;

	client = <Cluster | RedisClient>{};
	connection_string = "";

	group_name = "Batch_Processor";
	consumer_name = "";
	stopSubscribers = false;

	constructor(connection_string: string) {
		Redis.instance = this;
		this.connection_string = connection_string;
		if (process.env.REDIS_CLUSTER_MODE) {
			this.client = new RedisClient.Cluster([connection_string]);
		} else {
			this.client = new RedisClient(connection_string);
		}
		this.consumer_name = v4();
	}

	public static getInstance(): Redis | undefined {
		return Redis.instance;
	}

	async connect(): Promise<void> {
		try {
			this.client.on("connect", (message: unknown) =>
				logger.debug("Redis Cluster Connect Event: %o", message)
			);
			this.client.on("end", (message: unknown) =>
				logger.warn("Redis Cluster End Event: %o", message)
			);
			this.client.on("ready", (message: unknown) =>
				logger.info("Redis Cluster Ready Event: %o", message)
			);
			this.client.on("error", (err) => logger.error("Redis Cluster Error Event: %o", err));

			let connected = false;
			let count = 0;
			while (!connected) {
				if (this.client.status != "ready") {
					count++;
					logger.error("Redis cluster not connected yet after %o secs.", count * 10);
					await sleep(10000);
				} else {
					logger.info("Successfully connected with redis cluster");
					connected = true;
				}
			}

			// No explicit connection is required in case of "ioredis" but required in "node-redis" library
			// await this.client.connect();
		} catch (err) {
			logger.error("Error occurred in connect: %o", err);
			throw err;
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.client.quit();
		} catch (err) {
			logger.error("Error occurred in disconnect: %o", err);
			throw err;
		}
	}

	async publish(queueName: string, data: string | string[]) {
		try {
			await this.ensureConsumerGroup(queueName);

			if (Array.isArray(data)) {
				await Promise.all(
					data.map(async (message) => {
						await this.client.xadd(queueName, "*", "data", message);
					})
				);
			} else {
				await this.client.xadd(queueName, "*", "data", data);
			}
		} catch (err) {
			logger.error("Error occurred in add: %o", err);
			throw err;
		}
	}

	async subscribe(queueName: string, callback: (message: string) => Promise<void>) {
		const newClient = this.client.duplicate();

		try {
			await this.ensureConsumerGroup(queueName);

			while (!this.stopSubscribers) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const result: any = await newClient.xreadgroup(
						"GROUP",
						this.group_name,
						this.consumer_name,
						"COUNT",
						"1",
						"BLOCK",
						5000,
						"STREAMS",
						queueName,
						">"
					);

					if (result == null) {
						continue;
					}

					const messageId = result[0][1][0][0];
					const message = result[0][1][0][1][1];

					await callback.call(this, message);

					logger.debug(
						"Processed message id : %o. Message: %o. Deleting the message from queue",
						messageId,
						message
					);

					await newClient.xdel(queueName, messageId);

					logger.debug("Deleted message id %o from queue", messageId);
				} catch (err) {
					logger.error("Error occurred in reading from steam: %o", err);
				}
			}
		} catch (err) {
			logger.error("Error occurred in get: %o", err);
			throw err;
		} finally {
			await newClient.quit();
		}
	}

	async getCurrentQueueLength(queueName: string): Promise<number> {
		return await this.client.xlen(queueName);
	}

	private async ensureConsumerGroup(queueName: string) {
		await this.client.xgroup("CREATE", queueName, this.group_name, "0", "MKSTREAM").catch((err) => {
			if (err.message.includes("already exists")) {
				logger.info("Xgroup %o already exists for stream %o", this.group_name, queueName);
			} else {
				logger.error("Error while creating xgroup: %o", err);
				throw err;
			}
		});
	}
}

export { Redis };

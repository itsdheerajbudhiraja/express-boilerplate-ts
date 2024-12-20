import "./dotenv.js";
import "./db/index.js";

import type http from "http";

import esMain from "es-main";
import sleep from "sleep-promise";

import createSwaggerJson from "./createSwaggerJson.js";
import { db } from "./db/index.js";
import {
	ensureDbCollectionsAndIndexes,
	ensureEncryptionKeys
} from "./ensureDbCollectionsAndIndexes.js";
import { pQueue } from "./p_queue/index.js";
import { io as webSocket } from "./routes/app.js";
import { logger } from "./winston_logger.js";
import { terminatePool } from "./workers/index.js";

/**
 * Startup Function - Entrypoint of the Application to initialize dependencies.
 */
async function startup() {
	if (process.env.UPDATE_SWAGGER_ON_START) {
		logger.info("Updating swagger specs");
		createSwaggerJson();
		logger.info("Updated swagger specs\n");
	}

	logger.info("Connecting to database");
	await db.connect();
	logger.info("Connected to Database\n");

	logger.info("Connecting to persistent queue");
	await pQueue.connect();
	logger.info("Connected to persistent queue");

	logger.info("Ensuring indexes on database\n");
	await ensureDbCollectionsAndIndexes();

	logger.info("Ensuring Encryption keys\n");
	await ensureEncryptionKeys();

	logger.info("Starting API server\n");
	const server = (await import("./routes/index.js")).server as http.Server;

	// graceful shutdown handling
	process.on("SIGTERM", async () => {
		if (process.env.ENABLE_WEBSOCKET_SERVER) {
			logger.info("Closing all socket connections");
			await webSocket?.close();
		}

		server.close(async () => {
			logger.info("Server shutdown completed");

			logger.info("Server shutdown completed");
			await sleep(5000);

			logger.info("Terminating worker pool");
			await terminatePool();
			logger.info("Terminated worker pool");

			await sleep(5000);

			logger.info("Terminating database connection");
			await db.disconnect();
			logger.info("Terminated database connection");

			await sleep(3000);

			logger.info("Terminating persistent queue connection");
			await pQueue.disconnect();
			logger.info("Terminated persistent queue connection");

			await sleep(3000);

			logger.info("Exiting ....");
			process.exit(0);
		});
	});
}

if (esMain(import.meta)) {
	startup().catch((err) => {
		logger.error("Error occurred during startup: %o :", err);
		logger.error("Stopping process");
		process.exit(1);
	});
}

export { startup };

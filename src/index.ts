import "./dotenv.js";
// This line prevents dotenv.js import to get sorted when running organize import in vscode
import esMain from "es-main";
import http from "http";
import { Cache } from "./cache/index.js";
import createSwaggerJson from "./createSwaggerJson.js";
import { db } from "./db/index.js";
import {
	ensureDbCollectionsAndIndexes,
	ensureEncryptionKeys
} from "./ensureDbCollectionsAndIndexes.js";
import { EntityCollectionUndefinedError } from "./errors/EntityCollectionUndefinedError.js";
import { pQueue } from "./p_queue/index.js";
import { logger } from "./winston_logger.js";
import sleep from "sleep-promise";
import { terminatePool } from "./workers/index.js";

/**
 * Startup Function - Entrypoint of the Application to initialize dependencies.
 */
async function startup() {
	try {
		if (process.env.UPDATE_SWAGGER_ON_START) {
			logger.info("Updating swagger specs");
			createSwaggerJson();
			logger.info("Updated swagger specs\n");
		}

		logger.info("Connecting to database");
		await db.connect();
		logger.info("Connected to Database\n");

		logger.info("Ensuring indexes on database\n");
		await ensureDbCollectionsAndIndexes();

		logger.info("Ensuring Encryption keys\n");
		await ensureEncryptionKeys();

		logger.info("Connecting to persistent queue cluster");
		await pQueue.connect();
		logger.info("Connected to persistent queue cluster");

		logger.info("Creating Cache instances");
		new Cache("ApplicationCache");

		logger.info("Starting API server\n");
		const server = (await import("./routes/index.js")).server as http.Server;

		// graceful shutdown handling
		process.on("SIGTERM", () => {
			server.close(async () => {
				logger.info("Server shutdown completed");
				await sleep(5000);

				logger.info("Terminating worker pool");
				await terminatePool();
				logger.info("Terminated worker pool");

				await sleep(5000);

				logger.info("Terminating database connection");
				await db.disconnect();
				logger.info("Terminated database connection");

				logger.info("Terminating redis connection");
				pQueue.stopSubscribers = true;
				await pQueue.disconnect();
				logger.info("Terminated redis connection");

				await sleep(3000);
				logger.info("Exiting ....");
				process.exit(0);
			});
		});
	} catch (err) {
		logger.error("Error occurred during startup: %o", err);
		if (err instanceof EntityCollectionUndefinedError) {
			logger.error("Stopping process ...");
			process.exit(1);
		}
	}
}

if (esMain(import.meta)) {
	startup();
}

export { startup };

import "../dotenv.js";

import { db } from "../db/index.js";
import { ensureDbCollectionsAndIndexes } from "../ensureDbCollectionsAndIndexes.js";
import { logger } from "../winston_logger.js";

export default async function globalSetup() {
	try {
		logger.info("globalSetup for jest started");
		logger.info("Connecting to database");
		await db.connect();
		logger.info("Connected to Database\n");

		logger.info("Ensuring indexes on database");
		await ensureDbCollectionsAndIndexes();
		logger.info("Starting API server\n");
	} catch (err) {
		logger.error("Error occurred during startup: %o", err);
	}
}

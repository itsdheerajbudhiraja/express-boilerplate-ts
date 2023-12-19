import { db } from "../db/index.js";
import { logger } from "../winston_logger.js";

export default async function globalTearDown() {
	logger.info("globalTeardown for jest started");
	logger.info("Deleting test database");
	await db.mongoClient.db(db.dbName).dropDatabase();
	logger.info(`${db.dbName} dropped`);
}

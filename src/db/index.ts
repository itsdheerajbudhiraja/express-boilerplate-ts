import { logger } from "../winston_logger.js";
import MongoDb from "./mongo.js";
// Other Databases imports here after implementation

const supportedDbs = {
	MongoDb: MongoDb
	// Add more supported Database implementation here. Should be implementation of DbInterface.ts
};

const db_type = process.env.DB_TYPE as keyof typeof supportedDbs;

const db_connection_string =
	process.env.DB_CONNECTION_STRING === undefined
		? (function () {
				logger.error("DB_CONNECTION_STRING not found in environment variable");
				process.exit(1);
			})()
		: process.env.DB_CONNECTION_STRING;

logger.debug("Database type: %o", db_type);
logger.debug("Value of database connection string %o: ", db_connection_string);

const databaseInstance =
	supportedDbs[db_type].getInstance() || new supportedDbs[db_type](db_connection_string);

export { databaseInstance as db };

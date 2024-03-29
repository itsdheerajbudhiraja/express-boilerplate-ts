import { logger } from "../winston_logger.js";

import MongoDb from "./mongo.js";
// Other Databases imports here after implementation

const supportedDbs = {
	MongoDb: MongoDb
	// Add more supported Database implementation here. Should be implementation of DbInterface.ts
};

const db_type = process.env.DB_TYPE as string;
logger.debug("Database type: %o", db_type);

const db_connection_string = process.env.DB_CONNECTION_STRING;
logger.debug("Value of database connection string %o: ", db_connection_string);

if (!(db_type in supportedDbs)) {
	logger.error("Unsupported database type: %o", db_type);
	process.exit(1);
}

const databaseInstance =
	supportedDbs[db_type as keyof typeof supportedDbs].getInstance() ||
	new supportedDbs[db_type as keyof typeof supportedDbs](db_connection_string);

export { databaseInstance as db };

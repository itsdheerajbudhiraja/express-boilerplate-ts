import deepMerge from "deepmerge";
import esMain from "es-main";
import { writeFileSync } from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

import swaggerConfig from "./configs/swaggerConfig.json" with { type: "json" };
import existingSwagger from "./tsoa-specs.json" with { type: "json" };
import { dirName } from "./utils/fileDirName.js";
import { logger } from "./winston_logger.js";

const modifiedSwaggerFilePath = path.join(dirName(import.meta), "../swagger.json");

function createSwaggerJson() {
	try {
		const swaggerSpecs = swaggerJsdoc(swaggerConfig);
		logger.debug("Updating swagger specs json file: %o", modifiedSwaggerFilePath);
		const mergedSwagger = deepMerge(swaggerSpecs, existingSwagger, {
			arrayMerge: (des, src) => {
				return Array.from(new Set([...des, ...src]));
			}
		});
		writeFileSync(modifiedSwaggerFilePath, JSON.stringify(mergedSwagger, null, 4));
		logger.debug("Latest swagger specs updated in %o", modifiedSwaggerFilePath);
	} catch (err) {
		logger.error("Error occurred while creating swagger specs json: %o", err);
	}
}

if (esMain(import.meta)) {
	createSwaggerJson();
}

export default createSwaggerJson;

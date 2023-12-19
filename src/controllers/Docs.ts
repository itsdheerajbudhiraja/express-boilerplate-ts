import express, { NextFunction, Request, Response, Router } from "express";
import { authenticateDocsApiKey } from "../middlewares/authMiddleware.js";
import swaggerUI from "swagger-ui-express";
import { readFileSync } from "fs";
import path from "path";
import { dirName } from "../utils/fileDirName.js";

const router = Router();
const swaggerSpecs = JSON.parse(
	readFileSync(path.join(dirName(import.meta), "../../swagger.json")).toString()
);

if (process.env.EXPOSE_SWAGGER_DOCS) {
	/**
	 * @openapi
	 * /docs/swagger/{docsApiKey}/swagger.json:
	 *   get:
	 *     summary: Download JSON of Swagger Docs
	 *     tags:
	 *       - docs
	 *     parameters:
	 *      - in: path
	 *        name: docsApiKey
	 *        description: DOCS API KEY
	 *        required: true
	 *        schema:
	 *          type: string
	 *     responses:
	 *       "200":
	 *         description: "Swagger Docs for REST API endpoints"
	 *       "404":
	 *         description: "Not Found"
	 */
	router.use(
		`/swagger/${process.env.DOCS_API_KEY}/swagger.json`,
		(req: Request, res: Response, next: NextFunction) => {
			if (process.env.AUTHENTICATE_SWAGGER_DOCS) {
				authenticateDocsApiKey(req, res, next);
			} else {
				next();
			}
		},
		(req: Request, res: Response, _next: NextFunction) => {
			return res.sendFile(path.join(dirName(import.meta), "../../swagger.json"));
		}
	);
}

if (process.env.EXPOSE_SWAGGER_DOCS) {
	/**
	 * @openapi
	 * /docs/swagger/{docsApiKey}:
	 *   get:
	 *     summary: Swagger Docs UI
	 *     tags:
	 *       - docs
	 *     parameters:
	 *      - in: path
	 *        name: docsApiKey
	 *        description: DOCS API KEY
	 *        required: true
	 *        schema:
	 *          type: string
	 *     responses:
	 *       "200":
	 *         description: "Swagger Docs for REST API endpoints"
	 *       "404":
	 *         description: "Not Found"
	 */
	router.use(
		`/swagger/${process.env.DOCS_API_KEY}`,
		(req: Request, res: Response, next: NextFunction) => {
			if (process.env.AUTHENTICATE_SWAGGER_DOCS) {
				authenticateDocsApiKey(req, res, next);
			} else {
				next();
			}
		},
		(req: Request, res: Response, next: NextFunction) => {
			const url =
				req.protocol + "://" + (req.get("host") || process.env.SWAGGER_BASE_URL || "localhost");
			const filteredServer = swaggerSpecs.servers.filter(
				(server: { url: string; description: string }) => server.url == url
			);
			if (filteredServer.length == 0) {
				swaggerSpecs.servers.unshift({
					url: url
				});
			} else {
				swaggerSpecs.servers.splice(swaggerSpecs.servers.indexOf(filteredServer[0]), 1);
				swaggerSpecs.servers.unshift({
					url: url
				});
			}
			req.swaggerDoc = swaggerSpecs;
			next();
		},
		swaggerUI.serve,
		swaggerUI.setup(undefined, {
			customSiteTitle: process.env.APPLICATION_TITLE,
			swaggerOptions: {
				tagsSorter: function (a: string, b: string) {
					if (b == "docs" || b == "health") {
						return -1;
					} else {
						return 1;
					}
				}
			}
		})
	);
}

if (process.env.EXPOSE_TYPE_DOCS) {
	/**
	 * @openapi
	 * /docs/typedoc/{docsApiKey}:
	 *   get:
	 *     summary: Typescript docs
	 *     tags:
	 *       - docs
	 *     parameters:
	 *      - in: path
	 *        name: docsApiKey
	 *        description: DOCS API KEY
	 *        required: true
	 *        schema:
	 *          type: string
	 *     responses:
	 *       "200":
	 *         description: "Typescript docs"
	 *       "404":
	 *         description: "Not Found"
	 */
	router.use(
		`/typedoc/${process.env.DOCS_API_KEY}`,
		(req: Request, res: Response, next: NextFunction) => {
			if (process.env.AUTHENTICATE_TYPE_DOCS) {
				authenticateDocsApiKey(req, res, next);
			} else {
				next();
			}
		},
		express.static(path.join(dirName(import.meta), "../../typedocs"))
	);
}

if (process.env.EXPOSE_TEST_REPORTS) {
	/**
	 * @openapi
	 * /docs/test-report/{docsApiKey}:
	 *   get:
	 *     summary: Test Report
	 *     tags:
	 *       - docs
	 *     parameters:
	 *      - in: path
	 *        name: docsApiKey
	 *        description: DOCS API KEY
	 *        required: true
	 *        schema:
	 *          type: string
	 *     responses:
	 *       "200":
	 *         description: "Test Report"
	 *       "404":
	 *         description: "Not Found"
	 */
	router.use(
		`/test-report/${process.env.DOCS_API_KEY}`,
		(req: Request, res: Response, next: NextFunction) => {
			if (process.env.AUTHENTICATE_TYPE_DOCS) {
				authenticateDocsApiKey(req, res, next);
			} else {
				next();
			}
		},
		express.static(path.join(dirName(import.meta), "../../reports"), {
			index: ["test-report.html"]
		})
	);
}

export const docsRouter = router;

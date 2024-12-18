import { existsSync, readFileSync } from "fs";
import http from "http";
import https from "https";
import path from "path";

import { logger } from "../winston_logger.js";

import { app, io } from "./app.js";

const HOST: string = process.env.HOST || "0.0.0.0";
const PORT: number = process.env.PORT || 3000;

let server;

if (process.env.HTTPS) {
	if (process.env.SSL_CRT_FILE && process.env.SSL_KEY_FILE) {
		const certExists = existsSync(path.resolve(process.env.SSL_CRT_FILE));
		const keyExists = existsSync(path.resolve(process.env.SSL_KEY_FILE));
		if (!certExists) {
			logger.error("SSL_CRT_FILE path not exist");
			process.exit(1);
		}
		if (!keyExists) {
			logger.error("SSL_KEY_FILE path not exist");
			process.exit(1);
		}

		server = https
			.createServer(
				{
					key: readFileSync(path.resolve(process.env.SSL_KEY_FILE)),
					cert: readFileSync(path.resolve(process.env.SSL_CRT_FILE)),
					secureProtocol: "TLSv1_2_method"
				},
				app
			)
			.listen(PORT, HOST, () => {
				logger.info(`API server is listening at https://${HOST}:${PORT}`);
			});
	} else {
		logger.error("SSL_KEY_FILE or SSL_CRT_FILE is not defined.");
		process.exit(1);
	}
} else {
	server = http.createServer(app).listen(PORT, HOST, () => {
		logger.info(`API server is listening at http://${HOST}:${PORT}`);
	});
}

if (process.env.ENABLE_WEBSOCKET_SERVER) {
	io?.listen(server);
}

export { server };

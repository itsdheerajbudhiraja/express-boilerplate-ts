import axios, { type AxiosError } from "axios";
import http from "http";
import https from "https";

import { logger } from "../winston_logger.js";

export const axiosInstance = axios.create({
	baseURL: process.env.SCRIPT_SERVER_BASE_URL,
	headers: {
		"x-api-key": process.env.SCRIPT_SERVER_API_KEY
	},
	httpAgent: new http.Agent({ keepAlive: true }),
	httpsAgent: new https.Agent({ keepAlive: true })
});

axiosInstance.interceptors.response.use(
	(response) => response,
	(err: AxiosError) => {
		if (err.code == "ECONNREFUSED") {
			logger.error(
				"Please ensure base url is correct and server is running. Base URL: %o",
				process.env.SCRIPT_SERVER_BASE_URL
			);
		}

		return Promise.reject(err);
	}
);

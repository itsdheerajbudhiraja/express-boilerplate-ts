import type { AxiosRetryConfig } from "../types/Common.js";
import type { AxiosInstance } from "axios";

import sleep from "sleep-promise";

import { logger } from "../winston_logger.js";

export function injectRetryInterceptorInAxiosInstance(axiosInstance: AxiosInstance) {
	axiosInstance.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			const { config } = error as { config: AxiosRetryConfig | undefined };
			if (!config?.maxRetries) {
				logger.debug("Max retries exceeded");
				throw error;
			}
			logger.axiosErrorResponse(`Axios error occurred in : ${config.url}`, error);

			await sleep(Math.pow(config.retryExponentBase, config.retriedCount) * 1000);
			config.maxRetries -= 1;
			config.retriedCount += 1;

			return axiosInstance(config);
		}
	);
}

import type { WebsocketNotificationData } from "../../types/WebsocketNotificationData.js";

import { pQueue } from "../../p_queue/index.js";
import { io } from "../../routes/app.js";
import { logger } from "../../winston_logger.js";

export class WebsocketNotificationService {
	// subscribing to redis queue for notifications
	static startNotificationSubscription() {
		pQueue.subscribe(process.env.NOTIFICATION_QUEUE, this.handleNotificationEvent).catch((err) => {
			logger.error("Error occurred in subscribing to notification queue: %o", err);
		});
	}

	/**
	 * Sends notification to candidate or organization
	 */
	static async sendNotification(notificationData: WebsocketNotificationData) {
		await pQueue.publish(process.env.NOTIFICATION_QUEUE, JSON.stringify(notificationData));
	}

	//publishing notification to admin user or end user
	private static handleNotificationEvent(message: string): void {
		const websocketNotificationData = JSON.parse(message) as WebsocketNotificationData;
		const id = websocketNotificationData.id;
		const payload = websocketNotificationData.payload;
		const recipientType = websocketNotificationData.recipient_type;

		const notification_endpoint = `notifications/${recipientType}/${id}`;
		const notification = io.of(notification_endpoint);
		logger.debug(
			"Sending websocket notification to %o with payload : %o",
			notification_endpoint,
			payload
		);
		notification.emit("notifications", payload);
	}
}

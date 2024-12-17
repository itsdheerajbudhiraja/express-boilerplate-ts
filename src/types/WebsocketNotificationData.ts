//TODO:  Modify the type if required, as per the requirements that will come later when implementing websocket notification.

import type { User } from "../entities/User.js";

export type UserActionsNotificationPayload = {
	message: string;
	user_id: typeof User.prototype._id;
	task_id?: string;
	is_error_notification: boolean;
};

/**
 * Notification payload
 */
export type WebsocketNotificationPayload = UserActionsNotificationPayload;

/**
 * Determines the type of notification payload
 */
export type WebsocketNotificationType = "UserActions";

/**
 * Determines whom to send notification
 */
export type WebsocketRecipientType = "admin" | "user";

/**
 * Data required to send websocket notification
 */
export type WebsocketNotificationData = {
	payload: { type: WebsocketNotificationType; data: WebsocketNotificationPayload };
	id: string;
	recipient_type: WebsocketRecipientType;
};

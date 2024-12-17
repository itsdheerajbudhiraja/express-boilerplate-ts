import type { User } from "../entities/User.js";

export type UserCreationParams = Omit<User, "_id">;

/** Info about uploaded document/file that needs to added to the User profile */
export type UploadedDocument = {
	label: string;
	content: Buffer;
	fileExtension: "jpg" | "jpeg" | "png" | "pdf";
};

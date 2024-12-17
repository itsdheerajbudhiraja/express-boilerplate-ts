import type { User } from "../entities/User.js";

import { logger } from "../winston_logger.js";

import { axiosInstance } from "./axiosInstance.js";

export async function main() {
	logger.info("Executing PopulateUsers");

	const errors: {
		PopulateUsers: unknown[];
	} = {
		PopulateUsers: []
	};

	await Promise.all(
		users.map(async (user) => {
			logger.debug("Inserting/Updating user: %o", user.name);
			await axiosInstance
				.put("/users", user)
				.then()
				.then((resp) => {
					logger.axiosSuccessResponse("User Create response: %o", resp);
				})
				.catch((error) => {
					errors.PopulateUsers.push({
						code: error.code,
						status: error.response.status,
						data: error.response?.data,
						url: error.response?.config.url,
						message: error.message,
						body: JSON.stringify(user, null, 2)
					});
					logger.axiosErrorResponse("Error occurred in populating user: %o", error);
				});
		})
	);

	if (errors.PopulateUsers.length) {
		return errors;
	}

	logger.info("Executed PopulateUsers");
}

const users: User[] = [
	{
		name: "User1",
		email: "user1@example.com",
		mobile: "+919878987678"
	}
];

import { v4 } from "uuid";
import { db } from "../db/index.js";
import { BadRequest } from "../errors/ApiError.js";
import { UserCreationParams } from "../types/UserCreationParams.js";
import { assignDefined } from "../utils/assignDefined.js";
import { BaseEntity } from "./BaseEntity.js";

class User extends BaseEntity {
	static collectionName = "users";

	name!: string;
	email!: string;
	mobile!: string;
	pic?: string;

	constructor(user: UserCreationParams) {
		super();
		this._id = v4();
		assignDefined(this, user);
	}

	static async updateProfilePic(userId: string, imageBase64: string) {
		const user = await db.findOne<User>(User.collectionName, { _id: userId });
		if (!user) {
			throw new BadRequest("User Doesn't exist with provided user Id");
		}
		user.pic = imageBase64;
		await db.updateOne<User>(User.collectionName, { _id: user._id }, { $set: user });
		return user;
	}
}

export { User };

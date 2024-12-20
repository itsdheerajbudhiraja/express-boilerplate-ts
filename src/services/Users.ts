import type { UserCreationParams } from "../types/User.js";

import { User } from "../entities/User.js";

export class UsersService {
	public async getUserById(id: string, _name?: string): Promise<User> {
		return (await User.getById(id)) || <User>{};
	}

	public async getAllUsers(): Promise<{ content: User[]; total_elements: number }> {
		return await User.getAll();
	}

	public async create(userCreationParams: UserCreationParams): Promise<User> {
		return await User.save(new User(userCreationParams));
	}

	public async updateProfilePic(userId: string, imageBase64: string): Promise<User> {
		return await User.updateProfilePic(userId, imageBase64);
	}
}

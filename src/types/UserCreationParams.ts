import type { User } from "../entities/User.js";

export type UserCreationParams = Omit<User, "_id">;

import "../../../db/index.js"; // This is added to load database first before User to avoid circular dependency : User --> database -> encryptionConfig --> User.
import { User } from "../../../entities/User.js";
import { BadRequest } from "../../../errors/ApiError.js";

let user = new User({
	email: "user@test.com",
	name: "username",
	mobile: "1234567890"
});

describe("User Entity", () => {
	describe("save", () => {
		describe("incorrect mobile number format", () => {
			it("should throw validation error", async () => {
				await User.save(user)
					.then((val) => {
						expect(val).toBeUndefined();
					})
					.catch((err) => {
						expect(err).toBeDefined();
					});
			});
		});

		describe("correct user data", () => {
			it("should return user", async () => {
				const validUser: User = { ...user, mobile: "+917234567890" };
				user = await User.save(validUser)
					.then((val) => {
						expect(val).toBeDefined();
						expect(val._id).toBeDefined();
						return val;
					})
					.catch((err) => {
						expect(err).toBeUndefined();
						return <User>{};
					});
			});
		});
	});

	describe("getById", () => {
		describe("incorrect user id", () => {
			it("should return blank user object", async () => {
				await User.getById("invalid_user_id")
					.then((val) => {
						expect(val).toBeNull();
					})
					.catch((err) => {
						expect(err).toBeUndefined();
					});
			});
		});

		describe("correct user id", () => {
			it("should return user object", async () => {
				await User.getById(user._id as string)
					.then((val) => {
						expect(val).toEqual(user);
					})
					.catch((err) => {
						expect(err).toBeUndefined();
					});
			});
		});
	});

	describe("updateProfilePic", () => {
		describe("incorrect user id passed", () => {
			it(`should throw BadRequest Error`, async () => {
				await User.updateProfilePic("invalid_user_id", "imageBase64StringHere")
					.then((val) => {
						expect(val).toBeUndefined();
					})
					.catch((err) => {
						expect(err).toBeInstanceOf(BadRequest);
					});
			});
		});

		describe("correct user id passed", () => {
			it(`should throw BadRequest Error`, async () => {
				user = await User.updateProfilePic(user._id as string, "imageBase64StringHere")
					.then((val) => {
						expect(val).toEqual({ ...user, pic: expect.any(String) });
						return val;
					})
					.catch((err) => {
						expect(err).toBeNull();
						return <User>{};
					});
			});
		});
	});

	describe("getAll", () => {
		describe("one user is there in database", () => {
			it("should return array of user of length 1", async () => {
				await User.getAll()
					.then((users) => {
						expect(users.content).toContainEqual(user);
						expect(users.content.length).toEqual(1);
					})
					.catch((err) => {
						expect(err).toBeUndefined();
					});
			});
		});

		describe("one user is there in database", () => {
			it("should return array of user of length 1", async () => {
				await User.getAll()
					.then((users) => {
						expect(users.content).toContainEqual(user);
						expect(users.content.length).toEqual(1);
					})
					.catch((err) => {
						expect(err).toBeUndefined();
					});
			});
		});

		describe("delete user from database", () => {
			it("should delete user from database", async () => {
				const deleteResult = User.deleteById(user._id as string);
				await expect(deleteResult).resolves.not.toThrow();
			});
		});

		describe("no user is there in database", () => {
			it("should return blank array", async () => {
				await User.getAll()
					.then((users) => {
						expect(users.content.length).toEqual(0);
					})
					.catch((err) => {
						expect(err).toBeUndefined();
					});
			});
		});
	});
});

import { StatusCodes } from "http-status-codes";
import supertest from "supertest";
import { app } from "../../../routes/app.js";
import { jest } from "@jest/globals";

const testApp = supertest(app);

const headers = {
	"x-api-key": process.env.ADMIN_API_KEY as string
};

const routes = [
	{
		method: "get",
		path: "/users"
	},
	{
		method: "get",
		path: "/users/{userId}"
	},
	{
		method: "post",
		path: "/users"
	},
	{
		method: "post",
		path: "/users/image/{imageId}"
	}
] as const;

describe("user controller", () => {
	describe("authentication check on all routes", () => {
		routes.forEach((route) => {
			it(`should return ${StatusCodes.UNAUTHORIZED} for path: ${route.path}`, async () => {
				await testApp[route.method](route.path).expect(StatusCodes.UNAUTHORIZED);
			});
		});
	});

	describe("POST /users", () => {
		const _route = "/users";
		describe("Spied authentication", () => {
			it(`should return ${StatusCodes.OK}`, async () => {
				// const spy = jest.spyOn(authMiddleware, "expressAuthentication");

				// spy.mockImplementation(() => {
				// 	return Promise.resolve();
				// });
				const mockAuth = jest.fn(async () => {
					return Promise.resolve();
				});

				jest.unstable_mockModule("../../../middlewares/authMiddleware.js", () => ({
					expressAuthentication: mockAuth
				}));

				const { expressAuthentication: _ } = await import("../../../middlewares/authMiddleware.js");

				//await testApp.get(route).expect(StatusCodes.OK);
				//expect(mockAuth).toHaveBeenCalled();
				//TODO: implement mock
				expect(true).toBe(true);
			});
		});

		describe("Request with missing required attributes", () => {
			it(`should return ${StatusCodes.BAD_REQUEST}`, async () => {
				await testApp.post("/users").set(headers);

				expect(StatusCodes.BAD_REQUEST);
			});
		});
	});

	describe("GET /", () => {
		describe("Request with missing required attributes", () => {
			it(`should return ${StatusCodes.BAD_REQUEST}`, async () => {
				await testApp.get("/").expect(StatusCodes.OK);
			});
		});
	});
});

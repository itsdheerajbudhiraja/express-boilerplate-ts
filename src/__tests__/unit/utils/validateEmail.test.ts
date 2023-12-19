import { ValidationError } from "../../../errors/ValidationError.js";
import { validateEmail } from "../../../utils/validateEmail.js";

describe("validateEmail util", () => {
	describe("invalid email passed", () => {
		describe("wrong domain", () => {
			it("should throw validation error", async () => {
				const email = "test@gmial.com";
				await expect(validateEmail(email)).rejects.toBeInstanceOf(ValidationError);
			});
		});

		describe("[@] symbol not there", () => {
			it("should throw validation error", async () => {
				const email = "testgmial.com";
				await expect(validateEmail(email)).rejects.toBeInstanceOf(ValidationError);
			});
		});

		describe("wrong or non existing top level domain passed", () => {
			it("should throw validation error", async () => {
				const email = "test@gmail.abcxyz";
				await expect(validateEmail(email)).rejects.toBeInstanceOf(ValidationError);
			});
		});
	});

	describe("valid email passed", () => {
		describe("Non existent email", () => {
			it("should not throw validation error", async () => {
				const email = "test@gmail.com";
				await expect(validateEmail(email)).resolves;
			});
		});

		describe("correct email", () => {
			it("should not throw validation error", async () => {
				const email = "noreply@gmail.com";
				await expect(validateEmail(email)).resolves.toBeUndefined();
			});
		});
	});
});

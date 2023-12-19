import { ValidationError } from "../../../errors/ValidationError.js";
import { validatePhoneNumber } from "../../../utils/validatePhoneNumber.js";

describe("validatePhoneNumber util", () => {
	describe("invalid mobile no passed", () => {
		describe("string passed", () => {
			it("should throw validation error", async () => {
				const mobileNo = "some random string";
				await expect(validatePhoneNumber(mobileNo)).rejects.toBeInstanceOf(ValidationError);
			});
		});

		describe("'+' not passed", () => {
			it("should throw validation error", async () => {
				const mobileNo = "911234567890";
				await expect(validatePhoneNumber(mobileNo)).rejects.toBeInstanceOf(ValidationError);
			});
		});

		describe("not a valid indian number, should start with >=6", () => {
			it("should throw validation error", async () => {
				const mobileNo = "+911234567890";
				await expect(validatePhoneNumber(mobileNo)).rejects.toBeInstanceOf(ValidationError);
			});
		});

		describe("no of digits are less", () => {
			it("should throw validation error", async () => {
				const mobileNo = "+918765432";
				await expect(validatePhoneNumber(mobileNo)).rejects.toBeInstanceOf(ValidationError);
			});
		});
	});

	describe("valid mobile number passed", () => {
		describe("valid indian number", () => {
			it("should not throw validation error", async () => {
				const mobileNo = "+918765432345";
				await expect(validatePhoneNumber(mobileNo)).resolves.toBeUndefined();
			});
		});

		describe("valid us number", () => {
			it("should not throw validation error", async () => {
				const mobileNo = "+18765432345";
				await expect(validatePhoneNumber(mobileNo)).resolves.toBeUndefined();
			});
		});
	});
});

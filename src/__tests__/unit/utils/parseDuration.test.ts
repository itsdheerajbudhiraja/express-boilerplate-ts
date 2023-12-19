import { parseDuration } from "../../../utils/parseDuration.js";

describe("parseDuration util", () => {
	describe("invalid inputs", () => {
		describe("arbitary string", () => {
			it("should throw error", () => {
				expect(() => parseDuration("abcd")).toThrow();
			});
		});

		describe("multiple durations", () => {
			it("should throw error", () => {
				expect(() => parseDuration("7h10m")).toThrow();
			});
		});
	});

	describe("valid inputs", () => {
		describe("ms", () => {
			it("should return duration in ms", () => {
				expect(parseDuration(10000)).toEqual(10000);
			});
		});

		describe("s", () => {
			it("should return duration in ms", () => {
				expect(parseDuration("300s")).toEqual(300 * 1000);
			});
		});

		describe("m", () => {
			it("should return duration in ms", () => {
				expect(parseDuration("48m")).toEqual(48 * 60 * 1000);
			});
		});

		describe("h", () => {
			it("should return duration in ms", () => {
				expect(parseDuration("24h")).toEqual(24 * 60 * 60 * 1000);
			});
		});

		describe("d", () => {
			it("should return duration in ms", () => {
				expect(parseDuration("7d")).toEqual(7 * 24 * 60 * 60 * 1000);
			});
		});
	});
});

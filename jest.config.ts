import type { Config } from "jest";

const jestConfig: Config = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	testMatch: ["<rootDir>/dist/__tests__/**/*.test.js"],
	globalSetup: "<rootDir>/dist/__tests__/globalSetup.js",
	globalTeardown: "<rootDir>/dist/__tests__/globalTeardown.js",
	verbose: true,
	forceExit: true,
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	reporters: [
		"default",
		[
			"jest-html-reporters",
			{
				pageTitle: "ExpressJs Jest Test Results",
				publicPath: "reports/",
				filename: "test-report.html",
				hideIcon: true,
				includeConsoleLog: true
			}
		]
	]
};
export default jestConfig;

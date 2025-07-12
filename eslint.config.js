import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [
	{
		ignores: [
			"eslint.config.js",
			"**/node_modules",
			"**/dist",
			"**/rust-wasm-libs",
			"**/typedocs",
			"**/reports",
			"**/tmp",
			"**/jest.config.ts"
		]
	},
	...compat.extends(
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	),
	{
		plugins: {
			"@typescript-eslint": typescriptEslint,
			import: fixupPluginRules(_import)
		},

		languageOptions: {
			globals: {
				...globals.browser
			},

			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",

			parserOptions: {
				project: true
			}
		},

		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
					ignoreRestSiblings: true
				}
			],

			"@typescript-eslint/no-unnecessary-condition": "error",
			"@typescript-eslint/no-floating-promises": "error",
			"no-shadow": "off",
			"@typescript-eslint/no-shadow": "error",
			"require-await": "off",
			"@typescript-eslint/require-await": "error",
			"no-nested-ternary": "error",
			"max-params": ["error", 10],
			"@typescript-eslint/consistent-type-imports": "error",

			"@typescript-eslint/no-unused-expressions": [
				"error",
				{ allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }
			],

			"import/newline-after-import": [
				"error",
				{
					count: 1
				}
			],

			"import/order": [
				"error",
				{
					groups: ["type", ["builtin", "external"], "parent", "sibling", "index"],

					alphabetize: {
						order: "asc"
					},

					"newlines-between": "always"
				}
			],

			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-deprecated": "error"
		}
	},
	{
		files: ["**/*.ts", "**/*.tsx"]
	},
	{
		files: ["src/controllers/**/*.ts"],

		rules: {
			"max-params": "off"
		}
	}
];

const { defineConfig, globalIgnores } = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const reactHooks = require("eslint-plugin-react-hooks");

const { fixupPluginRules } = require("@eslint/compat");

const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

module.exports = defineConfig([
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				Atomics: "readonly",
				SharedArrayBuffer: "readonly",
			},

			parser: tsParser,
			ecmaVersion: 2019,
			sourceType: "module",
			parserOptions: {},
		},

		extends: compat.extends(
			"eslint:recommended",
			"plugin:@typescript-eslint/eslint-recommended"
		),

		plugins: {
			"@typescript-eslint": typescriptEslint,
			"react-hooks": reactHooks,
		},

		rules: {
			semi: ["error", "always"],
			quotes: ["error", "single"],
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"object-curly-spacing": ["error", "never"],
			"array-bracket-spacing": ["error", "never"],
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
	globalIgnores(["dist/*"]),
]);

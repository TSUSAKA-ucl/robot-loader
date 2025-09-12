import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      globals: globals.browser, 
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
	ecmaFeatures: {
	  jsx: true
	}
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
    }
  },
];

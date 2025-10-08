import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

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
	},
      },
    },
    plugins: {
      react: pluginReact,   // ← plugin を追加
    },
    rules: {
      ...pluginReact.configs.recommended.rules, // ← React の recommended rules を展開
      "react/react-in-jsx-scope": "off",        // ← React 17+ なら不要なので off
    },
    settings: {
      react: {
	version: "detect", // ← React のバージョンを自動検出
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      "react/prop-types": "off",
    }
  },
];

import reactPlugin from "@eslint-react/eslint-plugin";
import importX from "eslint-plugin-import-x";
import onlyWarn from "eslint-plugin-only-warn";
import turbo from "eslint-plugin-turbo";
import globals from "globals";
import tseslint from "typescript-eslint";

import baseConfig from "./base.mjs";

export default tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.ts?(x)"],
    ...reactPlugin.configs["recommended-typescript"],
    rules: {
      ...reactPlugin.configs["recommended-typescript"].rules,
      "@eslint-react/no-array-index-key": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/dom-no-dangerously-set-innerhtml": "off",
      "@eslint-react/naming-convention-ref-name": "off",
      "@eslint-react/use-state": "off",
      "@eslint-react/unsupported-syntax": "error",
      "@eslint-react/web-api-no-leaked-timeout": "off",
    },
  },
  {
    plugins: {
      "only-warn": onlyWarn,
      "import-x": importX,
      turbo,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        React: true,
        JSX: true,
      },
    },

    settings: {
      "import-x/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-undef": "warn",
      curly: ["error"],
    },
  }
);

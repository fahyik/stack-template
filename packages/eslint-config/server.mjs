import importX, { createNodeResolver } from "eslint-plugin-import-x";
import turbo from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

import baseConfig from "./base.mjs";

export default tseslint.config(
  ...baseConfig,
  {
    ignores: ["build/", "**/*.js"],
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "import-x": importX,
      turbo,
    },
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({
          extensions: [".mjs", ".cjs", ".js", ".json", ".node", ".ts", ".tsx"],
          tsconfig: { configFile: "./tsconfig.json" },
        }),
      ],
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
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "import-x/no-cycle": "error",
      "no-unsafe-optional-chaining": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      eqeqeq: ["error"],
      curly: ["error"],
    },
  }
);

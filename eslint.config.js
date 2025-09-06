// eslint.config.js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      js,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...js.configs.recommended.rules,
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
]);

// https://medium.com/@sindhujad6/setting-up-eslint-and-prettier-in-a-node-js-project-f2577ee2126f
// npm i eslint-plugin-simple-import-sort

//  npm run lint
// npm run lint:fix

  // "scripts": {
  //   "test": "echo \"Error: no test specified\" && exit 1",
  //   "dev": "nodemon index.js",
  //   "lint": "eslint .",
  //   "lint:fix": "eslint . --fix"
  // },
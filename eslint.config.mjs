
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**"
    ]
  },
  {
    files: ["src/js/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,
        L: "readonly"
      }
    },

    rules: {
      ...js.configs.recommended.rules,

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      "no-undef": "error"
    }
  }
];

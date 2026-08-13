export default [
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        URL: "readonly",
        process: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
    },
  },
];

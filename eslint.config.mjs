import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    ignores: ["test/lock-files/**/*"],
  },
  {
    extends: [configs["recommended-dirty"]],
  },
]);

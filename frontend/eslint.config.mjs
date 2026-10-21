import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Next 16 で `next lint` が廃止されたため ESLint CLI(flat config)へ移行した。
// 旧 .eslintrc.json(extends: next/core-web-vitals)と .eslintignore の内容を引き継ぐ。
export default defineConfig([
  globalIgnores([".next/", ".next-build/", ".next-dev/", ".next-dev-preview*/", ".next-dev-static/", "out/", "node_modules/"]),
  ...nextCoreWebVitals
]);

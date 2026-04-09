import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  noExternal: [
    "tailwind-merge",
    "clsx",
    "class-variance-authority",
    "lucide-react",
    "radix-ui",
  ],
});

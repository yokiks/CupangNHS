import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        testTimeout: 30000,
        hookTimeout: 30000,
        globalSetup: ["./tests/globalSetup.js"],
        setupFiles: ["./tests/setup.js"],
        include: ["./tests/**/*.test.js"],
        sequence: {
            concurrent: false,
        },
        fileParallelism: false,
    },
});

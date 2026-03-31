import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60000,
    expect: { timeout: 10000 },
    fullyParallel: false,
    retries: 0,
    reporter: "list",
    use: {
        baseURL: "http://localhost:3100",
        headless: true,
        screenshot: "only-on-failure",
    },
    webServer: [
        {
            command: "node --env-file=.env.test server.js",
            cwd: "./server",
            port: 5100,
            timeout: 30000,
            reuseExistingServer: false,
            env: {
                PORT: "5100",
                DB_NAME: "cupangnhs_test",
                JWT_SECRET: "test-secret",
                JWT_EXPIRES_IN: "2h",
            },
        },
        {
            command: "npx vite --port 3100",
            port: 3100,
            timeout: 30000,
            reuseExistingServer: false,
            env: {
                VITE_API_TARGET: "http://localhost:5100",
            },
        },
    ],
});

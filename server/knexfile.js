import "./config/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connection = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cupangnhs",
    port: Number(process.env.DB_PORT) || 3306,
    timezone: "Z",
};

export default {
    client: "mysql2",
    connection,
    migrations: {
        directory: path.join(__dirname, "migrations"),
        tableName: "knex_migrations",
    },
    seeds: {
        directory: path.join(__dirname, "seeds"),
    },
    pool: {
        min: 0,
        max: 10,
    },
};

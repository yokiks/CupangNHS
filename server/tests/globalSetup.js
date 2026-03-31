import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import Knex from "knex";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env.test"), override: true });

const DB_NAME = process.env.DB_NAME || "cupangnhs_test";

export async function setup() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        port: Number(process.env.DB_PORT) || 3306,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await conn.end();

    const knex = Knex({
        client: "mysql2",
        connection: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,
            timezone: "Z",
        },
        migrations: {
            directory: resolve(__dirname, "..", "migrations"),
        },
    });

    await knex.migrate.latest();
    await knex.destroy();
}

export async function teardown() {
    // Leave DB for inspection; tests clean their own data
}

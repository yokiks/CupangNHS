import "dotenv/config";

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
        directory: "./migrations",
        tableName: "knex_migrations",
    },
    seeds: {
        directory: "./seeds",
    },
    pool: {
        min: 0,
        max: 10,
    },
};

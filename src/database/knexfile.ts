import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
    development: {
        client: "pg",
        connection: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASS || "postgres",
            database: process.env.DB_NAME || "meubanco",
        },
        migrations: {
            directory: "./src/database/migrations",
        },
    },
};

export default config;

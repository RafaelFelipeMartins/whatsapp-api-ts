import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
    development: {
        client: "pg",
        connection: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASS || "jclan",
            database: process.env.DB_NAME || "ecozap",
        },
        migrations: {
            directory: path.resolve(__dirname, "migrations"),
            extension: "ts",
        },
        useNullAsDefault: true,
    },
};

export default config;

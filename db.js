const { Pool } = require("pg");

const pool = process.env.DB_MODE === "neon"
    ? new Pool({
        connectionString: process.env.DATABASE_URL
    })
    : new Pool({
        user: "postgres",
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT)
    });

module.exports = pool;
const { Pool } = require("pg");

const pool = new Pool({
    ...(process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL
        }
        : {
            user: "postgres",
            host: "localhost",
            database: "skillissue_db",
            password: process.env.DB_PASSWORD,
            port: 5432
        })
});

module.exports = pool;
const { Client } = require('pg');
const logger = require('./logger');
const schemas = require('../schema/Tables')

// Create a new client instance using environment variables
const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "sneha@sql123",
    port: 5432,
    database: "blog_backend"
});
client.connect()
    .then(async () => {
        logger.info('Connected to the database successfully');
        // Create tables
        await client.query(schemas.createAdminTable);
        await client.query(schemas.createUserTable);
        await client.query(schemas.createBlogsTable);
        await client.query(schemas.createCommentsTable);
        await client.query(schemas.createSharesTable);
        await client.query(schemas.adminNotificationTable);
        await client.query(schemas.userNotificationTable)
        // await client.query(schemas.createAdminNotificationsTable);
        logger.info('Tables created successfully or already exists');
    })
    .catch(err => logger.error('Failed to connect to the database', { error: err.stack }));

    module.exports = client;
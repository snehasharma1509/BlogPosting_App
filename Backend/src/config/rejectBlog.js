const logger = require('./logger');
const client = require('./db.js');

const rejectOldPendingBlogs = async () => {
    try {
        logger.info('Starting to reject old pending blogs...');
        
        // Query to update blogs and get updated rows
        const query = `
            UPDATE blogs
            SET blog_status = 'rejected'
            WHERE blog_status = 'pending'
            AND blog_id IN (
                SELECT blog_id
                FROM notifications
                WHERE is_read = FALSE
                AND created_at < NOW() - INTERVAL '30 minutes'
            )
            RETURNING blog_id, user_id, blog_title;
        `;

        const result = await client.query(query);

        logger.info(`Update query result: ${JSON.stringify(result.rows)}`);

        if (result.rows.length > 0) {
            // Delete notifications related to rejected blogs
            for (const blog of result.rows) {
                await client.query(`DELETE FROM notifications WHERE blog_id = $1`, [blog.blog_id]);
            }
            logger.info('Deleted notifications for rejected blogs.');

            // Insert into user_notifications
            for (const blog of result.rows) {
                const notificationText = `Blog with title ${blog.blog_title} has been automatically rejected because it was not viewed within 24 hours. You can send it again.`;
                await client.query(`
                    INSERT INTO user_notifications (user_id, blog_id, blog_title, notification_text, is_read)
                    VALUES ($1, $2, $3, $4, FALSE)
                `, [blog.user_id, blog.blog_id, blog.blog_title, notificationText]);
            }
            logger.info('Inserted user notifications.');

            // Reinsert into notifications
            for (const blog of result.rows) {
                const notificationText = `Blog with title ${blog.blog_title} has been automatically rejected because you did not view it within 24 hours.`;
                await client.query(`
                    INSERT INTO notifications (user_id, blog_id, blog_title, notification_text, is_read)
                    VALUES ($1, $2, $3, $4, FALSE)
                `, [blog.user_id, blog.blog_id, blog.blog_title, notificationText]);
            }
            logger.info('Reinserted notifications.');

            logger.info(`Automatically rejected ${result.rows.length} old pending blogs.`);
        } else {
            logger.info('No old pending blogs found to reject.');
        }
    } catch (error) {
        logger.error('Error rejecting old pending blogs:', error.message);
    }
};


const notifyAdminBeforeRejection = async () => {
    try {
        logger.info('Checking for blogs to notify admin before rejection...');

        // Query to find blogs that will be rejected in the next 20 minutes
        const query = `
            SELECT blog_id, user_id, blog_title
            FROM blogs
            WHERE blog_status = 'pending'
            AND blog_time BETWEEN NOW() - INTERVAL '30 minutes' AND NOW() - INTERVAL '20 minutes'
        `;

        const result = await client.query(query);

        if (result.rows.length > 0) {
            for (const blog of result.rows) {
                // Insert notification for each blog
                const notificationText = `Blog with title "${blog.blog_title}" will be automatically rejected in 20 minutes`;
                await client.query(
                    `INSERT INTO notifications (user_id, blog_id, blog_title, notification_text, is_read)
                     VALUES ($1, $2, $3, $4, FALSE)`,
                    [blog.user_id, blog.blog_id, blog.blog_title, notificationText]
                );

                logger.info(`Sent notification to admin for blog ID ${blog.blog_id}`);
            }
        } else {
            logger.info('No blogs need notification before rejection.');
        }
    } catch (error) {
        logger.error('Error notifying admin before rejection:', error.message);
    }
};

module.exports = {
    rejectOldPendingBlogs,
    notifyAdminBeforeRejection
};

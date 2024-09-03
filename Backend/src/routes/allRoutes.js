const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const auth= require('../middleware/auth.js');
const logger = require('../config/logger');
const client = require('../config/db.js');

// Admin routes
router.post('/admin/login', adminController.login);
router.post('/admin/register', adminController.register);
router.get('/admin/getUsersData', auth, adminController.getUsersData);
router.get('/admin/getBlogsData', auth, adminController.getBlogsData);
// Admin blog review routes
router.post('/admin/reviewBlog', auth, adminController.reviewBlog);
router.get('/admin/getAcceptedBlogs', auth, adminController.getAcceptedBlogs);
router.get('/admin/getRejectedBlogs', auth, adminController.getRejectedBlogs);
router.get('/admin/getPendingBlogs', auth, adminController.getPendingBlogs);
router.delete('/admin/deleteNotification/:notification_id', auth, async (req, res) => {
    try {
        const notification_id = req.params.notification_id;
        console.log(notification_id)

        if (!notification_id) {
            return res.status(400).json({ success: false, message: 'Notification ID is required' });
        }

        // Optional: Check if the notification exists before updating/deleting
        const checkNotification = await client.query('SELECT * FROM notifications WHERE notification_id = $1', [notification_id]);
        if (checkNotification.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Mark the notification as read
        await client.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [notification_id]);

        // Delete the notification
        const result = await client.query('DELETE FROM notifications WHERE notification_id = $1 RETURNING *', [notification_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found or already deleted' });
        }

        logger.info(`Notification with ID ${notification_id} deleted.`);
        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        logger.error('Error deleting notification:', error.stack); // Log the full error stack for better debugging
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});


// Admin notification routes
router.get('/admin/getNotifications', auth, adminController.getNotifications);
router.get('/admin/getBlogsData/:blog_id', async (req, res) => {
    const blog_id = req.params.blog_id;
    try {
        // Fetch blog data from database
        const blog = await client.query('SELECT * FROM blogs WHERE blog_id = $1', [blog_id]);
        if (blog.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, blogContent: blog.rows[0] });
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog data' });
    }
});


router.delete('/user/deleteNotification/:notification_id', auth, userController.deleteNotification);
router.get('/user/getBlogsData/:blog_id', async (req, res) => {
    const blog_id = req.params.blog_id;
    try {
        // Fetch blog data from database
        const blog = await client.query('SELECT * FROM blogs WHERE blog_id = $1', [blog_id]);
        if (blog.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, blogContent: blog.rows[0] });
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog data' });
    }
});

router.get('/admin/getDashboardStats', adminController.getDashboardStats);
router.get('/admin/notificationsCount',adminController.notificationsCount);


// User routes
router.post('/user/register', userController.register);
router.post('/user/login', userController.login);
router.post('/user/createBlog', auth, userController.createBlog);
router.post('/user/shareBlog', auth, userController.shareBlog);
router.post('/user/commentBlog', auth, userController.commentBlog);
router.get('/user/getAcceptedBlogs', auth, userController.getAcceptedBlogs);
router.get('/user/getUserNotifications', auth, userController.getUserNotifications);
router.delete('/user/deleteNotification/:id', auth, userController.deleteNotification);
router.get('/user/letter',userController.getletter);
router.get('/user/getblogs',userController.getBlogsData);
router.get('/user/notificationsCount', userController.notificationsCount);
router.post('/user/addNotification',userController.add_notification);
router.get('/user/getCommentsBlogId',auth,userController.getCommentsBlogId)
router.get('/user/getUsername',auth,userController.getUsername)


module.exports = router;
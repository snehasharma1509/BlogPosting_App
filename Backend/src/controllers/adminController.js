require('dotenv').config();
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin_model = require('../models/adminModel');
const client = require('../config/db.js');
const { body, validationResult } = require('express-validator');
const notification_model = require('../models/notification_model');
const blog_model = require('../models/blog_model');

const SECRET_KEY = process.env.SECRET_KEY

// Register Function
const register = async (req, res) => {
    try {
        const { admin_fname,admin_lname,admin_name, admin_email, admin_password,admin_confirm_password } = req.body;
        //validation
        //Define minimum and maximum lengths
        const minNameLength = 3;
        const maxNameLength = 20; 
        const maxEmailLength = 20;
        const minPasswordLength = 8;
        const maxPasswordLength= 20;

         // Regular expression for validating first and last names (only alphabets)
         const nameRegex = /^[a-zA-Z\s]+$/;

     
         const adminNameRegex = /^[a-zA-Z0-9._]+$/;
 
         if (!admin_fname || !admin_lname || !admin_name || !admin_email || !admin_password || !admin_confirm_password) {
             return res.status(400).json({ success: false, message: 'All fields are required' });
         }
 
         if (typeof admin_fname !== 'string' || !nameRegex.test(admin_fname)) {
             return res.status(400).json({ success: false, message: 'First name not contains special characters' });
         }
 
         if (typeof admin_lname !== 'string' || !nameRegex.test(admin_lname)) {
             return res.status(400).json({ success: false, message: 'Last name not contains special characters' });
         }
 
         if (admin_fname.length < minNameLength || admin_fname.length > maxNameLength) {
             return res.status(400).json({ success: false, message: `First name must be between ${minNameLength} and ${maxNameLength} characters long` });
         }
 
         if (admin_lname.length < minNameLength || admin_lname.length > maxNameLength) {
             return res.status(400).json({ success: false, message: `Last name must be between ${minNameLength} and ${maxNameLength} characters long `});
         }
 
         if (admin_name.length < minNameLength || admin_name.length > maxNameLength) {
             return res.status(400).json({ success: false, message:` Admin name must be between ${minNameLength} and ${maxNameLength} characters long `});
         }
 
         if (!adminNameRegex.test(admin_name)) {
             return res.status(400).json({ success: false, message: 'Admin name can only contain alphabets, numbers, underscores, and periods' });
         }
 
         const existingAdminByName = await admin_model.findByAdminname(admin_name);
         const existingAdminByEmail = await admin_model.findByAdminEmail(admin_email);
 
         if (existingAdminByName) {
             logger.error('Duplicate admin name detected', { admin_name });
             return res.status(400).json({ success: false, message: 'Admin name already taken' });
         }
 
         if (existingAdminByEmail) {
             logger.error('Duplicate admin email detected', { admin_email });
             return res.status(400).json({ success: false, message: 'Admin Email already in use' });
         }
 
         if (admin_email.length > maxEmailLength) {
             return res.status(400).json({ success: false, message: `Email must be less than ${maxEmailLength} characters long` });
         }

         const emailRegex = `/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/`;
         if (!emailRegex.test(admin_email)) {
             return res.status(400).json({ success: false, message: 'Invalid email format' });
         }
 
         if (admin_password.length < minPasswordLength) {
             return res.status(400).json({ success: false, message: `Password must be at least ${minPasswordLength} characters long` });
         }
 
         if (admin_password.length > maxPasswordLength) {
             return res.status(400).json({ success: false, message: `Password must not exceed ${maxPasswordLength} characters long `});
         }
 
         const passwordRegex = /^(?=.\d)(?=.[a-z])(?=.*[A-Z]).{8,}$/;
         if (!passwordRegex.test(admin_password)) {
             return res.status(400).json({ success: false, message: 'Password must include at least one uppercase letter and one number' });
         }
 

        //verification

        const a=admin_password;
        const b=admin_confirm_password;
        // Hash the password
        if (a===b){
            const hashedPassword = await bcrypt.hash(admin_password, 10);

        // Generate a token
        const token = jwt.sign({ email: admin_email }, SECRET_KEY, { expiresIn: '1h' });

        // Save admin details in the database
        const newAdmin = await admin_model.add_admin_data(admin_fname,admin_lname,admin_name, admin_email, hashedPassword, token);

        // Log the registration
        logger.info('Admin registered successfully', { admin_email, token });

        // Respond with the token
        res.json({
            success: true,
            message: 'Admin registered successfully',
            token: token,
            admin: newAdmin
        });
        }
        else{
            logger.error('Invalid Password');
            res.status(500).send('Invalid Password');
        }
    } catch (err) {
        logger.error('Error during admin registration', { error: err.message });
        res.status(500).send(err.message);
    }
};
//backend-->admincontroller-->login function

const login = [
    // Validation
    body('admin_email')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    body('admin_password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .trim(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { admin_email, admin_password } = req.body;

            // Fetch admin data from the database
            const admin = await admin_model.check_admin_data(admin_email);

            if (!admin) {
                logger.warn('Invalid login attempt', { admin_email });
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            // Compare the password
            const isPasswordValid = await bcrypt.compare(admin_password, admin.admin_password);

            if (!isPasswordValid) {
                logger.warn('Invalid login attempt', { admin_email });
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            // Verify the existing token or generate a new one
            let token;
            try {
                token = jwt.verify(admin.admin_access_token, SECRET_KEY);
                var aat=admin.admin_access_token
                logger.info('Token verified successfully', { token });
            } catch (err) {
                aat = jwt.sign({ email: admin_email }, SECRET_KEY, { expiresIn: '1h' });
                logger.info('New token generated', { token });
                // Optionally update the token in the database
            }

            // Respond with the token
            res.json({
                success: true,
                message: 'Login successful',
                token: aat
            });
        } catch (err) {
            logger.error('Error during admin login', { error: err.message });
            res.status(500).send(err.message);
        }
    }
];
  
// Get users data from the users table
const getUsersData = async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users');
        
        // Log the successful fetching of user data
        logger.info('Fetched user data successfully');

        // Send the data as a JSON response
        res.json(result.rows);  // Ensure only one response is sent and then exit
    } catch (error) {
        // Log the error
        logger.error('Error fetching user data', { error: error.message });

        // Check if headers are already sent to prevent multiple responses
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
            });
        } else {
            // Optionally log if headers were already sent
            logger.warn('Headers were already sent, skipping error response');
        }
    }
};


 //get blogs data
 const getBlogsData = async (req, res) => {
    try {
        const result = await client.query('SELECT blogs.blog_title, blogs.blog_time,blogs.blog_status,users.user_name FROM blogs JOIN users ON blogs.user_id = users.user_id');
        // Log the data fetching success
        logger.info('Fetched blogs data successfully');
        res.send(
            result.rows
        );
    
    } catch (error) {
        // Log the error and respond with an error message
        logger.error('Error fetching blogs data', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs data',
        });
    }
};




const getNotifications = async (req, res) => {
    try {
        const notifications = await notification_model.get_unread_notifications();
        if (!res.headersSent) {
            res.json({ success: true, notifications });
        }
    } catch (err) {
        logger.error('Error fetching notifications', { error: err.message });
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error fetching notifications' });
        }
    }
};


const reviewBlog = async (req, res) => {
    try {
        const { blog_id, blog_title, action } = req.body;

        // Validate action
        if (action !== 'accept' && action !== 'reject') {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        // Update blog status based on the action
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        
        // Update the blog status and get the user_id of the blog's author
        await blog_model.update_blog_status(blog_id, newStatus);
        
        // Get the user_id of the blog's author from the notifications table
        const result = await client.query('SELECT user_id FROM notifications WHERE blog_id = $1', [blog_id]);
        
        // Check if we got a result and extract the user_id
        if (result.rows.length === 0) {
            throw new Error('User ID not found');
        }
        
        const user_id = result.rows[0].user_id;
        
        // Notification text for user
        const user_notification_text = `Your blog titled "${blog_title}" has been "${newStatus}".`;

        const admin_notification_text = `You "${newStatus}" the "${blog_title}".`;

        // Insert a notification for the user
        await client.query(
            `INSERT INTO user_notifications (user_id, blog_id, blog_title, notification_text, is_read)
             VALUES ($1, $2, $3, $4, FALSE)`,
            [user_id, blog_id, blog_title, user_notification_text]
        );

        // Mark the original "pending" notification as read
        await notification_model.mark_as_read(blog_id);

        // Delete the original "pending" notification
        // await notification_model.delete_notification(blog_id);
        await client.query(
            `INSERT INTO notifications (user_id, blog_id, blog_title, notification_text, is_read)
             VALUES ($1, $2, $3, $4, FALSE)`,
            [user_id, blog_id, blog_title, admin_notification_text]
        );

        logger.info(`New Blog ${blog_id} has been ${newStatus} and notifications updated`);
        res.json({ success: true, message: `New Blog ${newStatus} successfully and notifications updated.` });
    } catch (err) {
        logger.error('Error reviewing blog', { error: err.message });
        res.status(500).json({ success: false, message: 'Error reviewing blog' });
    }
};






const getPendingBlogs = async (req, res) => {
    try {
        const result = await client.query(`SELECT blogs.*, users.user_name FROM blogs JOIN users ON blogs.user_id = users.user_id WHERE blogs.blog_status = 'pending';`);
        logger.info('Fetched Pending blogs data successfully');
        res.send(
            result.rows
        );
    
    } catch (error) {
        logger.error('Error fetching Pending blogs', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Pending blogs',
        });
    }
};


const getAcceptedBlogs = async (req, res) => {
    try {
        // SQL query to fetch all blogs with 'accepted' status
        const result = await client.query('SELECT * FROM blogs WHERE blog_status = $1', ['accepted']);

        if (result.rows.length === 0) {
            // Log and respond when there are no accepted blogs
            logger.info('No accepted blogs found');
            return res.status(404).json({
                success: true,
                message: 'No accepted blogs found',
                blogs: []
            });
        }

        // Log successful retrieval of accepted blogs
        logger.info('Fetched accepted blogs successfully');
        res.json(result.rows);
    } catch (error) {
        // Log error and respond with a failure message
        logger.error('Error fetching accepted blogs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accepted blogs',
        });
    }
};


// Function to get all rejected blogs
const getRejectedBlogs = async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM blogs WHERE blog_status = $1', ['rejected']);
        
        if (result.rows.length === 0) {
            logger.info('No rejected blogs found');
            return res.status(404).json({
                success: true,
                message: 'No rejected blogs found',
                blogs: []
            });
        }

        logger.info('Fetched rejected blogs successfully');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching rejected blogs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rejected blogs',
        });
    }
};


// const rejectOldPendingBlogs = async () => {
//     try {
//         logger.info('Starting to reject old pending blogs...');
//         const query = `
//             UPDATE blogs
//             SET blog_status = 'rejected'
//             WHERE blog_status = 'pending'
//             AND blog_time < NOW() - INTERVAL '24 hours'
//             RETURNING blog_id;
//         `;

//         const result = await client.query(query);

//         if (result.rows.length > 0) {
//             logger.info(Automatically rejected ${result.rows.length} old pending blogs.);
//         } else {
//             logger.info('No old pending blogs found to reject.');
//         }
//     } catch (error) {
//         logger.error('Error rejecting old pending blogs:', error.message);
//     }
// };

// // Initialize rejection process on application start
// rejectOldPendingBlogs();

// // Run the rejection script every hour
// setInterval(rejectOldPendingBlogs, 3600000); // 3600000 ms = 1 hour


const notificationsCount = async (req, res) => {
    try {
        const result = await client.query('SELECT COUNT(*) FROM notifications');
        logger.info('Query result:', result.rows[0]); // Log query result
        const count = result.rows[0].count;
        res.json({ count });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
}


const getDashboardStats= async(req, res)=>{
    try{
        const queries={
            totalUsers: 'SELECT COUNT(*) FROM users',
            totalBlogs: 'SELECT COUNT(*) FROM blogs',
            totalComments: 'SELECT COUNT(*) FROM comments',
            totalShares: 'SELECT COUNT(*) FROM shares',
        };

        const results= await Promise.all(
            Object.values(queries).map(query=> client.query(query))
        );

        const [totalUsersResult, totalBlogsResult, totalCommentsResult, totalSharesResult]= results;

        
        const totalUsers = parseInt(totalUsersResult.rows[0].count,10);
        const totalBlogs = parseInt(totalBlogsResult.rows[0].count,10);
        const totalComments = parseInt(totalCommentsResult.rows[0].count,10);
        const totalShares = parseInt(totalSharesResult.rows[0].count,10);

        const dailyData= await getDailyData();

        res.json({
            totalUsers,
            totalBlogs,
            totalComments,
            totalShares,
            dailyData
          });
        } catch (error) {
          // Log error and respond
          logger.error('Error fetching dashboard statistics:', { error: error.message });
          res.status(500).json({
            message: 'Error fetching statistics',
            error: error.message
          });
        }
      };
      
 // Example function to get daily data
 async function getDailyData() {
    // Implement your logic to fetch daily data
    // For example, you could write a query to get daily counts of blogs, comments, etc.
    return [];
  }
// const deleteNotification = async (req, res) => {
//     try {
//         const notification_id = req.params.notificationId;
        
//         if (!notification_id) {
//             return res.status(400).json({ success: false, message: 'Notification ID is required' });
//         }
//         // First, mark the notification as read
//         await client.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [notification_id]);

//         // Then, delete the notification
//         const result = await client.query('DELETE FROM notifications WHERE notification_id = $1 RETURNING *', [notification_id]);

//         if (result.rowCount === 0) {
//             return res.status(404).json({ success: false, message: 'Notification not found or already deleted' });
//         }

//         logger.info(`Notification with ID ${notification_id} deleted.`);
//         res.status(200).json({ success: true, message: 'Notification deleted successfully' });
//     } catch (error) {
//         logger.error('Error deleting notification:', error.message);
//         res.status(500).json({ success: false, message: 'Failed to delete notification' });
//     }
// };



module.exports = {
    register,
    login,
    getUsersData,
    getBlogsData,
    getNotifications,
    reviewBlog,
    getPendingBlogs,
    getAcceptedBlogs,
    notificationsCount,
    getRejectedBlogs,
    getDashboardStats,
    
};

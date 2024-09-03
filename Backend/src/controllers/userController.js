//userController.js
require('dotenv').config();
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user_model = require('../models/userModel');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const blog_model = require('../models/blog_model');
const notification_model = require('../models/notification_model');
const SECRET_KEY = process.env.SECRET_KEY;
const client = require('../config/db.js'); 
// Register function
const register = async (req, res) => {
    try {
        const { user_fname, user_lname, user_name, user_email, user_password, user_confirm_password } = req.body;
        
        // Validation constants
        const minNameLength = 3;
        const maxNameLength = 20; 
        const maxEmailLength = 20;
        const minPasswordLength = 8;
        const maxPasswordLength = 20;

        // Regular expressions
        const nameRegex = /^[a-zA-Z\s]+$/;  // Name should only contain alphabets
        const usernameRegex = /^[a-zA-Z0-9._]+$/; // Username validation
        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/; // Basic email validation
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/; // Password validation

        // Check if all fields are present
        if (!user_fname || !user_lname || !user_name || !user_email || !user_password || !user_confirm_password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Name validation
        if (typeof user_fname !== 'string' || !nameRegex.test(user_fname) || user_fname.length < minNameLength || user_fname.length > maxNameLength) {
            return res.status(400).json({ success: false, message: `First name must be between ${minNameLength} and ${maxNameLength} characters long and contain only alphabets` });
        }

        if (typeof user_lname !== 'string' || !nameRegex.test(user_lname) || user_lname.length < minNameLength || user_lname.length > maxNameLength) {
            return res.status(400).json({ success: false, message: `Last name must be between ${minNameLength} and ${maxNameLength} characters long and contain only alphabets` });
        }

        // Username validation
        if (!usernameRegex.test(user_name) || user_name.length < minNameLength || user_name.length > maxNameLength) {
            return res.status(400).json({ success: false, message: `User name must be between ${minNameLength} and ${maxNameLength} characters long and contain only letters, numbers, underscores, and periods` });
        }

        // Email validation
        if (!emailRegex.test(user_email) || user_email.length > maxEmailLength) {
            return res.status(400).json({ success: false, message: 'Invalid email format or too long' });
        }

        // Check if passwords match
        if (user_password !== user_confirm_password) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        // Password validation
        if (!passwordRegex.test(user_password)) {
            return res.status(400).json({ success: false, message: 'Password must include at least one uppercase letter, one lowercase letter, and one number' });
        }

        // Check if user already exists by username or email
        const existingUserByName = await user_model.findByUsername(user_name);
        const existingUserByEmail = await user_model.findByUserEmail(user_email);

        if (existingUserByName) {
            return res.status(400).json({ success: false, message: 'User name already taken' });
        }

        if (existingUserByEmail) {
            return res.status(400).json({ success: false, message: 'User email already in use' });
        }

        // Hash password and generate token
        const hashedPassword = await bcrypt.hash(user_password, 10);
        const token = jwt.sign({ email: user_email }, SECRET_KEY, { expiresIn: '24h' });

        // Save new user
        const newUser = await user_model.add_user_data(user_fname, user_lname, user_name, user_email, hashedPassword, token);

        // Success response
        res.json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: newUser
        });

    } catch (err) {
        logger.error('Error during user registration', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

//login function
const login = [
    // Validate and sanitize input fields
    body('user_email')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    body('user_password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .trim(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { user_email, user_password } = req.body;

            // Fetch user data from the database
            const user = await user_model.check_user_data(user_email);

            if (!user) {
                logger.warn('Invalid login attempt', { user_email });
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            // Compare the password
            const isPasswordValid = await bcrypt.compare(user_password, user.user_password);

            if (!isPasswordValid) {
                logger.warn('Invalid login attempt', { user_email });
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            // Verify the existing token or generate a new one
            let token;
            try {
                token = jwt.verify(user.user_access_token, SECRET_KEY);
                var uat = user.user_access_token;
                logger.info('Token verified successfully', { token });
            } catch (err) {
                uat = jwt.sign({ email: user_email }, SECRET_KEY, { expiresIn: '24h' });
                logger.info('New token generated', { token: uat });
                // Optionally update the token in the database
            }

            // Respond with the token
            res.json({
                success: true,
                message: 'Login successful',
                token: uat
            });
        } catch (err) {
            logger.error('Error during user login', { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
];

// Create blog function
const createBlog = async (req, res) => {
    try {
        const { blog_title, blog_intro, blog_additional_info } = req.body;

        // Check for the token in the headers
        const token = req.headers['token'];

        // Verify the token and extract the user email
        let verified_data;
        try {
            verified_data = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            logger.error('Token verification failed:', err.message);
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const user_email = verified_data.email;

        // Fetch the user ID from the database using the email
        const user = await user_model.get_user_by_email(user_email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user_id = user.user_id;
        const user_name=user.user_name

        // Set blog status to 'pending' initially
        const blog_status = 'pending';

        // Insert the blog data into the database
        const newBlog = await user_model.create_blog_data(user_id, blog_title, blog_intro, blog_additional_info, blog_status);

        if (!newBlog) {
            throw new Error('Blog creation failed');
        }
        const notificationText = `New blog titled "${blog_title}" by user ${user_name}`;
        await notification_model.create_notification(user_id, newBlog.blog_id,newBlog.blog_title, notificationText);

        // Log the blog creation
        logger.info('Blog created successfully', { blog_title, user_email });

        // Respond with the newly created blog details
        res.json({
            success: true,
            message: 'Blog created successfully ',
            blog: newBlog
        });
    } catch (err) {
        logger.error('Error during blog creation', { error: err.message });
        res.status(500).json({ success: false, message: 'Error during blog creation', error: err.message });
    }
};


const shareBlog = async (req, res) => {
    try {
        const { blog_id } = req.body;

        // Ensure that count_blogs is awaited since it's an asynchronous function
        const blog_count = await user_model.count_blogs(blog_id);

        if (blog_count === 1) {
            // Check for the token in the headers
            const token = req.headers['token'];

            // Verify the token and extract the user email
            let verified_data;
            try {
                verified_data = jwt.verify(token, SECRET_KEY);
            } catch (err) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }

            const user_email = verified_data.email;

            // Fetch the user ID from the database using the email
            const user = await user_model.get_user_by_email(user_email);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const user_id = user.user_id;

            // Insert the blog data into the database
            const newShare = await user_model.add_share_data(blog_id, user_id);

            // Log the blog creation
            logger.info('Shared successfully');

            // Respond with the newly created blog details
            return res.json({
                success: true,
                message: 'Shared successfully',
                share: newShare // Assuming you want to return the newly created share details
            });
        } else {
            logger.info('Share count is limited to 5 users');
            return res.status(403).json({
                success: false,
                message: 'Sharing this particular blog is limited to 5 users. To share more, please take a subscription.'
            });
        }
    } catch (err) {
        logger.error('Error during blog sharing', { error: err.message });
        return res.status(500).json({ error: err.message });
    }
};

const commentBlog = async (req, res) => {
    try {
        const { comment_text, blog_id } = req.body;

        // Check for the token in the headers
        const token = req.headers['token'];

        // Verify the token and extract the user id
        let verified_data;
        try {
            verified_data = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const user_email= verified_data.email;

        // Fetch the user by user_id
        const user = await user_model.get_user_by_email(user_email);
        const user_id=user.user_id

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Insert the comment data into the database
        const newComment = await user_model.add_comment(comment_text, blog_id, user_id);

        // Log the comment
        logger.info(`Commented on blog ${blog_id} successfully`, { comment_text, blog_id });

        // Respond with the newly created comment
        res.json({
            success: true,
            message: 'Commented successfully',
            comment: newComment
        });
    } catch (err) {
        logger.error('Error during blog commenting', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

// const getBlogsData = async (req, res) => {
//     try {
//         const query = `
//             SELECT blog_title, 
//             blog_intro, 
//             blog_additional_info, 
//             blog_media, 
//             blog_time
//             FROM blogs ;
//         `;
        
//         const result = await client.query(query);
        
//         // Log the data fetching success
//         logger.info(`Fetched ${result.rows.length} pending blogs successfully`);
        
//         res.json({
//             success: true,
//             data: result.rows
//         });
    
//     } catch (error) {
//         // Log the error and respond with an error message
//         logger.error('Error fetching accepted blogs data', { error: error.message });
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch accepted blogs data',
//             error: error.message
//         });
//     }
// };


//usercontroller.js

const getBlogsData = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM blogs ;
        `;
        
        const result = await client.query(query);
        
        // Log the data fetching success
        logger.info('Fetched ${result.rows.length} pending blogs successfully');
        
        res.json({
            success: true,
            data: result.rows
        });
    
    } catch (error) {
        // Log the error and respond with an error message
        logger.error('Error fetching accepted blogs data', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accepted blogs data',
            error: error.message
        });
    }
};


const getletter = async (req, res) => {
    try {
      const token = req.headers['token'];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token is missing' });
      }
  
      // Verify the token and extract the user email
      let verified_data;
      try {
        verified_data = jwt.verify(token, SECRET_KEY);
      } catch (err) {
        logger.error('Token verification failed:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
  
      const user_email = verified_data.email;
    //   console.log(user_email);
  
      // Query to select the first letter of the username directly using user_email
      const query = 'SELECT SUBSTRING(user_name, 1, 1) AS first_letter FROM users WHERE user_email = $1';
      const result = await client.query(query, [user_email]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no letter available'
        });
      }
  
      const firstLetter = result.rows[0].first_letter;
  
      res.json({
        success: true,
        first_letter: firstLetter
      });
    } catch (error) {
      logger.error('Error fetching user letter:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user letter',
      });
    }
  };

const getAcceptedBlogs = async (req, res) => {
    try {
        const acceptedBlogs = await blog_model.get_accepted_blogs();
        res.json({ success: true, blogs: acceptedBlogs });
    } catch (err) {
        logger.error('Error fetching accepted blogs', { error: err.message });
        res.status(500).json({ success: false, message: 'Error fetching accepted blogs' });
    }
};

const add_notification = async (req, res) => {
    try {
        const { user_id, blog_id, notification_text ,blog_title} = req.body;
        // Ensure the correct column names are used here:
        await client.query(
            'INSERT INTO user_notifications (user_id, blog_id, notification_text,blog_title) VALUES ($1, $2, $3,$4)',
            [user_id, blog_id, notification_text,blog_title]
        );
        res.status(200).json({ message: 'Notification added successfully' });
    } catch (err) {
        console.error('Error querying the database:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getUserNotifications = async (req, res) => {
    try {
        const token = req.headers['token'];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access token is missing' });
        }

        // Verify the token and extract the user email
        let verified_data;
        try {
            verified_data = jwt.verify(token, SECRET_KEY);
            logger.info('Token verified successfully:', verified_data);
        } catch (err) {
            logger.error('Token verification failed:', err.message);
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const user_email = verified_data.email;
        logger.info('User email extracted from token:', user_email);

        // Fetch the user ID from the database using the email
        const user = await user_model.get_user_by_email(user_email);
        if (!user) {
            logger.warn('No user found with email:', user_email);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user_id = user.user_id; // Correctly extract user_id
        logger.info('User ID:', user_id);

        // Fetch notifications for the user
        const result = await client.query('SELECT * FROM user_notifications WHERE user_id=$1', [user_id]);

        if (result.rows.length === 0) {
            logger.info('No notifications found for user ID:', user_id);
            return res.status(200).json({
                success: true,
                message: 'No notifications found',
                notifications: []
            });
        }

        logger.info('User notifications fetched successfully:', result.rows);
        res.json({
            success: true,
            message: 'Notifications fetched successfully',
            notifications: result.rows,
        });
    } catch (error) {
        logger.error('Error fetching user notifications:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user notifications',
        });
    }
};

const notificationsCount = async (req, res) => {
    try {

        const token = req.headers['token'];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access token is missing' });
        }

        // Verify the token and extract the user email
        let verified_data;
        try {
            verified_data = jwt.verify(token, SECRET_KEY);
            logger.info('Token verified successfully:', verified_data);
        } catch (err) {
            logger.error('Token verification failed:', err.message);
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const user_email = verified_data.email;
        logger.info('User email extracted from token:', user_email);

        // Fetch the user ID from the database using the email
        const user = await user_model.get_user_by_email(user_email);
        if (!user) {
            logger.warn('No user found with email:', user_email);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user_id = user.user_id; // Correctly extract user_id
        logger.info('User ID:', user_id);

        const result = await client.query('SELECT COUNT(*) FROM user_notifications WHERE user_id=$1', [user_id]);
        logger.info('Query result:', result.rows[0]); // Log query result
        const count = result.rows[0].count;
        res.json({ count });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
}

const getCommentsBlogId = async (req, res) => {
    try {
        const { blog_id } = req.query; 
        const comments = await user_model.get_comments(blog_id);
        console.log(comments)
        res.json({ success: true, comments: comments });
    } catch (err) {
        logger.error('Error fetching accepted comments', { error: err.message });
        res.status(500).json({ success: false, message: 'Error fetching accepted comments' });
    }
}

const getUsername = async (req, res) => {
    const userId = req.query.user_id; // Extract user_id from the query parameters
    
    try {
        const result = await user_model.get_username(userId); // Call the model function
        
        if (result && result.length > 0) {
          const userName = result[0].user_name;
          console.log('User Name:', userName);
          res.status(200).json({ user_name: userName });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        res.status(500).json({ message: 'Server error' });
      }
    };
  
    

const deleteNotification= async (req, res) => {
    try {
        const notification_id = req.params.notification_id;
        console.log(notification_id)

        if (!notification_id) {
            return res.status(400).json({ success: false, message: 'Notification ID is required' });
        }

        // Optional: Check if the notification exists before updating/deleting
        const checkNotification = await client.query('SELECT * FROM user_notifications WHERE notification_id = $1', [notification_id]);
        if (checkNotification.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Mark the notification as read
        await client.query('UPDATE user_notifications SET is_read = TRUE WHERE notification_id = $1', [notification_id]);

        // Delete the notification
        const result = await client.query('DELETE FROM user_notifications WHERE notification_id = $1 RETURNING *', [notification_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found or already deleted' });
        }

        logger.info(`Notification with ID ${notification_id} deleted.`);
        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        logger.error('Error deleting notification:', error.stack); // Log the full error stack for better debugging
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
}

module.exports = {
    register,
    login,
    createBlog,
    shareBlog,
    commentBlog,
    getAcceptedBlogs,
    getUserNotifications,
    deleteNotification,
    getletter,
    getBlogsData,
   notificationsCount,
    add_notification,
    getCommentsBlogId,
    getUsername
};

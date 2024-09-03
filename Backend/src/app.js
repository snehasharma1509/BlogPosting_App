//backend -->app.js
const logger = require('./config/logger.js');
const express = require('express');
const cors=require('cors');
const app = express();


app.use(express.json());
app.use(cors());
const client = require('./config/db.js');

//Port connection
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

//Routes
const allRoutes = require('./routes/allRoutes.js');
app.use('/',allRoutes);

// app.post('/login',(req,res)=>{
//     const sql='SELECT admin_email FROM admin WHERE admin_email = $1'
//    const res= client.query(sql,[req.body.admin_email]);
//    res.send(res.row[0]);
// })

const cron = require('node-cron');
const { rejectOldPendingBlogs } = require('./config/rejectBlog.js'); 

// Initialize rejection process on application start
rejectOldPendingBlogs();

// Schedule the task to run daily (every 24 hours)
cron.schedule('* * * * *', rejectOldPendingBlogs); // Runs at midnight every day

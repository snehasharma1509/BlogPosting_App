import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewBlog, setPreviewBlog] = useState(null); // State for blog to preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State to manage dialog visibility
    const [selectedNotificationId, setSelectedNotificationId] = useState(null); // State to track selected notification
    const navigate = useNavigate();

    // Fetch user notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:9000/user/getUserNotifications', {
                headers: { token: `${localStorage.getItem('accessToken')}` }
            });
            setNotifications(Array.isArray(response.data.notifications) ? response.data.notifications : []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleClosePage = () => {
        navigate('/dashboard');
    };

    // Fetch and open the preview dialog with blog content
    const handlePreview = async (blogId, notificationId, notificationText) => {
        try {
            const response = await axios.get(`http://localhost:9000/admin/getBlogsData/${blogId}`, {
                headers: { token: `${localStorage.getItem('accessToken')}` }
            });
            if (response.data.success) {
                setPreviewBlog({
                    ...response.data.blogContent,
                    notificationText: notificationText || 'No additional information'
                });
                setSelectedNotificationId(notificationId);
                setIsPreviewOpen(true);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error('Error fetching blog content:', err);
            setError('Failed to fetch blog content');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`http://localhost:9000/user/deleteNotification/${notificationId}`, {
                headers: { token: `${localStorage.getItem('accessToken')}` }
            });

            // Update state to remove the deleted notification
            setNotifications(prevNotifications => 
                prevNotifications.filter(notification => notification.id !== notificationId)
            );
            fetchNotifications();
            
        } catch (err) {
            console.error('Error deleting notification:', err);
            setError('Failed to delete notification');
        }
    };

    const handleClosePreview = async () => {
        if (selectedNotificationId) {
            await deleteNotification(selectedNotificationId);
        }
        setIsPreviewOpen(false);
        setPreviewBlog(null);
        setSelectedNotificationId(null);
    };

    if (loading) return <p>Loading notifications...</p>;

    return (
        <div className="w-full max-w-4xl mx-auto mt-4 bg-blue-100 rounded-md shadow-lg p-4 relative">
            <button onClick={handleClosePage} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>

            <h1 className="text-xl font-bold mb-2">User Notifications</h1>
            {error && <p className="text-red-500">{error}</p>}
            {notifications.length === 0 ? (
                <p>No notifications</p>
            ) : (
                <ul className="space-y-4">
                    {notifications.map(notification => (
                        <li key={notification.id} className="p-4 rounded-md shadow-md w-full max-w-3xl mx-auto bg-white">
                            <p className="font-semibold text-blue-800">{notification.blog_title}</p>
                            <p className="text-blue-700">{notification.notification_text}</p>
                            <button
                                onClick={() => handlePreview(notification.blog_id, notification.notification_id, notification.notification_text)}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Preview
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Preview Dialog */}
            {isPreviewOpen && previewBlog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{previewBlog.blog_intro}</h2>
                        <p className="mb-4">{previewBlog.blog_additional_info}</p>
                        <p className="mb-4">{previewBlog.notificationText}</p>
                        {/* Additional blog details can be added here */}
                        <button
                            onClick={handleClosePreview}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserNotifications;

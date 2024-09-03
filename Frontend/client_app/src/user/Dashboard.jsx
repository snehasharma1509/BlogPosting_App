//dashboard.js
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import BlogContent from '../component/BlogContent';
import Header from './Header';


const Dashboard = ({ user, onSignOut }) => {
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await axios.get('http://localhost:9000/user/getblogs', {
          headers: {
            token: `${token}`
          }
        });

        setBlogs(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to fetch blogs. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleSearch = (searchQuery) => {
    setSearchQuery(searchQuery);
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div>
      <Header user={user} onSignOut={onSignOut} onSearch={handleSearch} />
      <BlogContent blogs={blogs.filter((blog) => blog.blog_title.toLowerCase().includes(searchQuery.toLowerCase()))} />
    </div>
  );
};

export default Dashboard;

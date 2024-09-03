import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, PlusIcon, SearchIcon } from '@heroicons/react/solid';
import LetterCanvas from '../component/LetterCanvas';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Header = ({ user, onSignOut, onSearch }) => {
  const [notificationCount, setNotificationCount] = useState(0);

    // useEffect(() => {
    //     const fetchNotificationCount = async () => {
    //         try {
    //           console.log('i am in');
    //             const response = await axios.get('http://localhost:9000/user/notificationsCount',{
    //               //here, take authorization of user
    //             });
    //             const count = parseInt(response.data.count, 10);
    //             console.log('Notification count fetched:', count);
    //             setNotificationCount(count);
    //         } catch (error) {
    //             console.error('Error fetching notification count:', error);
    //         }
    //     };
    
    //     fetchNotificationCount();
    // }, []);

    useEffect(() => {
      const fetchNotificationCount = async () => {
          try {
              console.log('i am in');
              
              // Retrieve the token from local storage
              const token = localStorage.getItem('accessToken');
              if (!token) {
                  console.error('No token found in localStorage');
                  return;
              }
  
              // Make the request with the Authorization header
              const response = await axios.get('http://localhost:9000/user/notificationsCount', {
                  headers: {
                      token: `${token}`, // Include the token in the Authorization header
                  },
              });
  
              const count = parseInt(response.data.count, 10);
              console.log('Notification count fetched:', count);
              setNotificationCount(count);
          } catch (error) {
              console.error('Error fetching notification count:', error);
          }
      };
  
      fetchNotificationCount();
  }, []);
  


  const navigate = useNavigate();
  const [letter, setLetter] = useState('');

  const handleSearch = (e) => {
    const searchQuery = e.target.value;
    onSearch(searchQuery);
  };

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No token found in localStorage');
          return;
        }

        const response = await axios.get('http://localhost:9000/user/letter', {
          headers: {
            'token': `${token}`
          }
        });

        const capitalizedLetter = response.data.first_letter ? response.data.first_letter.toUpperCase() : '';
        setLetter(capitalizedLetter);
      } catch (error) {
        console.error('Error fetching letter:', error.response ? error.response.data : error.message);
      }
    };
    fetchLetter();
  }, []);

  const handleCreateBlog = () => {
    navigate('/create-blog');
  };

  const handleViewNotifications = () => {
    navigate('/notifications');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-800 text-white flex justify-between items-center p-3 shadow-md z-50">
      <div className="flex items-center flex-grow">
        <div className="text-2xl font-bold mr-6 cursor-pointer" onClick={() => navigate('/')}>
          Media Verse
        </div>
        <div className="flex items-center bg-gray-700 p-2 rounded-full border border-gray-600">
          <SearchIcon className="h-5 w-5 text-gray-300 mr-2" />
          <input
            type="text"
            placeholder="Search blogs..."
            className="bg-transparent focus:outline-none text-white placeholder-gray-400"
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={handleCreateBlog}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition duration-200"
        >
          <PlusIcon className="h-6 w-6" />
        </button>


        <div className="flex items-center space-x-6">
                <Link to="/notifications">
        <button
          onClick={handleViewNotifications}
          className="relative text-gray-300 hover:text-gray-400"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {notificationCount}
                      </span>
        </button>
        </Link>
        </div>

        <div className="flex items-center space-x-4">
          <LetterCanvas letter={letter} />
          <button
            onClick={onSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

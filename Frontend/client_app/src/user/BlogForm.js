import { Dialog } from '@headlessui/react';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBlog_main } from '../services/contextapi_state_management/action/action';
import { StoreContext } from '../services/contextapi_state_management/store';

const BlogForm = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [formData, setFormData] = useState({
    blog_title: '',
    blog_intro: '',
    blog_media: '',
    blog_additional_info: '',
    blog_status: 'pending',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [posted, setPosted] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'blog_media') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0].name });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found, please log in again.');
      }

      let base64Image = '';
      const file = e.target.blog_media.files[0];

      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          base64Image = reader.result;

          const formDataToSend = {
            blog_title: formData.blog_title,
            blog_intro: formData.blog_intro,
            blog_media: base64Image,
            blog_additional_info: formData.blog_additional_info,
            blog_status: formData.blog_status
          };

          createBlog_main(formDataToSend, dispatch, token).then(() => {
            setPosted(true);
            setSuccessMessage('Blog posted successfully!');
            setShowPreview(false);
            setTimeout(() => {
              navigate('/dashboard'); // Redirect to dashboard after delay
            }, 1000); // 1 second delay
          });
        };
      } else {
        const formDataToSend = {
          blog_title: formData.blog_title,
          blog_intro: formData.blog_intro,
          blog_media: null,
          blog_additional_info: formData.blog_additional_info,
          blog_status: formData.blog_status
        };

        createBlog_main(formDataToSend, dispatch, token).then(() => {
          setPosted(true);
          setSuccessMessage('Blog posted successfully!');
          setShowPreview(false);
          setTimeout(() => {
            navigate('/dashboard'); // Redirect to dashboard after delay
          }, 2000); // 2 seconds delay
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error.message);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // Function to close the form and navigate back
  const handleClose = () => {
    navigate('/dashboard'); // or use any other method to close the form or navigate
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-6">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Blog Title</label>
          <input
            type="text"
            name="blog_title"
            value={formData.blog_title}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Intro</label>
          <textarea
            name="blog_intro"
            value={formData.blog_intro}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Media</label>
          <input
            type="file"
            name="blog_media"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none"
            accept="image/*"
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-800 mb-2">Additional Information</label>
          <textarea
            name="blog_additional_info"
            value={formData.blog_additional_info}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4 mb-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Posting...' : 'Post'}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className={`bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 ${posted ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={posted}
          >
            Preview
          </button>
        </div>

        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
        {state.isError && <p className="text-red-500 text-center">{state.errorMessage}</p>}
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <Dialog open={showPreview} onClose={() => setShowPreview(false)} className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center">
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full space-y-4">
            <h3 className="text-3xl font-bold text-gray-800">{formData.blog_title}</h3>
            {formData.blog_media && <img src={formData.blog_media} alt="Blog Media" className="w-full h-auto rounded-lg shadow-md mb-4" />}
            <p className="text-lg text-gray-700 mb-4">{formData.blog_intro}</p>
            <p className="text-sm text-gray-600">{formData.blog_additional_info}</p>
            <button onClick={() => setShowPreview(false)} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Close Preview
            </button>
          </Dialog.Panel>
        </Dialog>
      )}
    </>
  );
};

export default BlogForm;

//blog content.js
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { FormatDate } from '../helper/FormatDate';

const BlogContent = ({ blogs }) => {
  const navigate = useNavigate(); // Create navigate instance

  const handleBlogClick = (blogId) => {
    // Ensure blogId is valid before navigating
    console.log(blogId)
    if (blogId) {
      navigate(`/blogs/${blogId}`); // Navigate to the blog detail page
    } else {
      console.error('Invalid blogId:', blogId);
    }
  };

  if (blogs.length === 0) return <div className="text-center py-4">No blogs available.</div>;

  return (
    <div className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-4">Latest Blogs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blogs.map((blog, index) => (
          <div 
            key={index} 
            className="flex flex-col border border-gray-200 rounded-lg p-4 relative cursor-pointer" 
            onClick={() => handleBlogClick(blog.blog_id)} // Ensure blog_id is used
          >
            {blog.media && blog.media.image && (
              <img src={blog.media.image} alt={blog.blog_title} className="w-full h-48 object-cover mb-2 rounded" />
            )}
            <h3 className="text-lg font-bold mb-1">{blog.blog_title}</h3>
            <p className="text-sm text-gray-600 mb-2">{blog.blog_intro}</p>
            <div className="flex items-center mt-auto">
              <div>
                <p className="text-sm font-medium text-green-600">{blog.user_name}</p>
                <p className="text-xs text-gray-400">
                  {FormatDate(blog.blog_time)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{blog.blog_additional_info}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogContent;

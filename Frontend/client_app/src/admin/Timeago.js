export default function TimeAgo(timestamp) {
    if (!timestamp) {
        return "Invalid date";
    }

    const createdDate = new Date(timestamp);
    if (isNaN(createdDate.getTime())) {
        return "Invalid date";
    }

    const currentDate = new Date();
    const timeDifference = currentDate - createdDate; // Difference in milliseconds

    const diffInSeconds = Math.floor(timeDifference / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30); // Approximate
    const diffInYears = Math.floor(diffInMonths / 12);

    if (diffInYears > 0) {
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    } else if (diffInMonths > 0) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
        return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
    }
}

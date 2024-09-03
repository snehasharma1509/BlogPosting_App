// export default UserList;
import React from 'react';
import LetterCanvas from '../component/LetterCanvas';

const UserList = ({ users }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {users.map((user, index) => {
        const firstLetter = user.user_name.charAt(0).toUpperCase();
        
        return (
          <div key={index} className="flex items-center p-4 border-b last:border-b-0 rounded">
            <div className="w-12 h-12 bg-blue-300 rounded-full flex items-center justify-center mr-4 text-white font-bold text-xl">
            <LetterCanvas letter={firstLetter} /> 
            </div>
            <div>
              <p className="font-medium">{user.user_name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserList;

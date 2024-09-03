import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook for redirection
import { Login_main_user } from '../services/contextapi_state_management/action/action';
import { StoreContext } from '../services/contextapi_state_management/store';
import SignUp from './SignUp';

const SignIn = ({ onSignIn }) => {
    const { state, dispatch } = useContext(StoreContext);
    const [user_email, setEmail] = useState('');
    const [user_password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const [showSignUpModal, setShowSignUpModal] = useState(false); // State to control modal visibility
    const navigate = useNavigate(); // Initialize useNavigate hook

    const handleSignIn = async (e) => {
        e.preventDefault();
        await Login_main_user(user_email, user_password, dispatch); // Dispatch is passed to main
    };

    useEffect(() => {
        if (state.data && !state.isError) {  // Check if data exists and no error
            onSignIn(state.data); // Call onSignIn with the token
            navigate('/dashboard'); // Redirect to the dashboard
        }
    }, [state.data, state.isError, onSignIn, navigate]); // Run this effect when state.data or state.isError changes

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4">Log In</h2>
                <form onSubmit={handleSignIn}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 mb-4 border rounded"
                            value={user_email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'} // Toggle input type based on state
                            placeholder="Password"
                            className="w-full p-2 mb-4 border rounded pr-10" // Add padding-right for the icon
                            value={user_password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded"
                        disabled={state.isLoading}
                    >
                        {state.isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                    {state.isError && <p className="text-red-500 mt-2">{state.errorMessage}</p>}
                </form>
                <p className="text-gray-600 mt-4">
                    Don't have an account? 
                    <button
                        type="button"
                        className="text-blue-500 ml-1"
                        onClick={() => setShowSignUpModal(true)}
                    >
                        Register
                    </button>
                </p>
            </div>
            {showSignUpModal && <SignUp closeModal={() => setShowSignUpModal(false)} />}
        </div>
    );
};

export default SignIn;
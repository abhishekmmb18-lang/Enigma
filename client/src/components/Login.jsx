import React, { useState } from 'react';

const Login = ({ onSwitch, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const formData = { email, password };

        try {
            // Try connecting to backend (Local or Remote)
            const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                onLogin(data.user);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Server connection failed. Is the backend running?');
        }
    };

    return (
        <div className="glass p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Welcome Back
            </h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500"
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500"
                        placeholder="Enter your password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold shadow-lg transform transition hover:-translate-y-0.5"
                >
                    Sign In
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                    onClick={onSwitch}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                    Sign up
                </button>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Mock API call
      // const response = await api.post('/auth/login', { email, password });
      
      // Mocking the authentication logic
      if (email === 'admin@test.com' && password === 'password') {
        login({ id: '1', email, fullName: 'System Admin', role: 'ADMIN' });
        navigate('/dashboard');
      } else if (email === 'manager@test.com' && password === 'password') {
        login({ id: '2', email, fullName: 'Department Manager', role: 'MANAGER', departmentId: 'd1' });
        navigate('/dashboard');
      } else if (email === 'employee@test.com' && password === 'password') {
        login({ id: '3', email, fullName: 'Regular Employee', role: 'EMPLOYEE', departmentId: 'd1' });
        navigate('/dashboard');
      } else {
        setError('Invalid credentials (use admin@test.com / password)');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">TaskFlow</h2>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="admin@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Demo accounts (pwd: password):</p>
          <ul className="mt-1">
            <li>admin@test.com</li>
            <li>manager@test.com</li>
            <li>employee@test.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;

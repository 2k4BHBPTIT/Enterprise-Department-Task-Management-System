import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { authApi } from '../../services/api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Role, User } from '../../types';

interface LoginViewProps {
  onLoggedIn: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const login = await authApi.login(email.trim(), password);
      localStorage.setItem('accessToken', login.accessToken || login.token || '');
      const user: User = {
        id: login.userId,
        full_name: login.fullName,
        name: login.fullName,
        email: login.email,
        department_id: login.departmentId ?? 0,
        departmentId: login.departmentId ?? 0,
        system_role: login.systemRole as Role,
        role: login.systemRole as Role,
        status: 'ACTIVE',
      };
      setCurrentUser(user);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF2FA] flex items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Đăng nhập hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Work & Project Management</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Mật khẩu
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5" />
        </label>
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2">
          <LogIn className="w-4 h-4" /> {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
};

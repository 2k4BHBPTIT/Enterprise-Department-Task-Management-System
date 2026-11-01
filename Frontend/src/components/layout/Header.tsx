import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { Role, User } from '../../types';
import { userApi } from '../../services/api/user.api';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { dashboardMode, setDashboardMode, currentUser, setCurrentUser, setRole } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    userApi.getUsers().then(setUsers).catch(() => undefined);
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = users.find((u) => String(u.id) === e.target.value);
    if (selected) setCurrentUser(selected);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-3.5 px-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Mode switcher tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl">
        <button
          onClick={() => setDashboardMode('PM')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            dashboardMode === 'PM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          PM Dashboard
        </button>
        <button
          onClick={() => setDashboardMode('HR')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            dashboardMode === 'HR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          HR Dashboard
        </button>
        <button
          onClick={() => setDashboardMode('EMAIL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            dashboardMode === 'EMAIL' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cấu hình Email
        </button>
      </div>

      {/* Role and User switcher for Pair-programming testing */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Người dùng:</span>
          <select
            value={currentUser.id}
            onChange={handleUserChange}
            aria-label="Chọn tài khoản người dùng"
            className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.departmentName})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-slate-500 font-medium">Vai trò:</span>
          <select
            value={currentUser.role}
            onChange={handleRoleChange}
            aria-label="Chọn vai trò người dùng"
            className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
            <option value="PROJECT_LEADER">PROJECT_LEADER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="PROJECT_MEMBER">PROJECT_MEMBER</option>
          </select>
        </div>
      </div>
    </header>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, ShieldCheck } from 'lucide-react';
import { userApi } from '../../services/api/user.api';
import { departmentApi } from '../../services/api/department.api';
import { Department, Role, User } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';

const roles: Array<{ value: Role; label: string; description: string }> = [
  { value: 'ADMIN', label: 'Admin', description: 'Toàn quyền quản trị hệ thống' },
  { value: 'MANAGER', label: 'Manager', description: 'Quản lý dự án, công việc và nhân sự' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', description: 'Quản lý dự án và phân công công việc' },
  { value: 'PROJECT_LEADER', label: 'Project Leader', description: 'Theo dõi và cập nhật công việc dự án' },
  { value: 'EMPLOYEE', label: 'Employee', description: 'Thực hiện và cập nhật công việc được giao' },
];

export const PermissionManagement: React.FC = () => {
  const { isAdmin, currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const { filters, setFilter } = useFilterStore();
  const search = filters.searchTerm;
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [savingId, setSavingId] = useState<number | string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [userData, departmentData] = await Promise.all([userApi.getUsers(), departmentApi.getDepartments()]);
      setUsers(userData);
      setDepartments(departmentData);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu phân quyền');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('app:reload', loadData);
    return () => window.removeEventListener('app:reload', loadData);
  }, []);

  const visibleUsers = useMemo(() => users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${user.full_name || user.name} ${user.email}`.toLowerCase().includes(term);
    const matchesRole = roleFilter === 'ALL' || (user.system_role || user.role) === roleFilter;
    return matchesSearch && matchesRole;
  }), [users, search, roleFilter]);

  const updateRole = async (user: User, role: Role) => {
    setSavingId(user.id);
    setError('');
    setSuccess('');
    try {
      await userApi.updateUser(user.id, { systemRole: role });
      setUsers((current) => current.map((item) => item.id === user.id
        ? { ...item, system_role: role, role }
        : item));
      setSuccess(`Đã cập nhật quyền cho ${user.full_name || user.name}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật quyền');
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin()) {
    return <div className="bg-white rounded-3xl border border-red-100 p-10 text-center text-sm text-red-600">Chỉ tài khoản Admin mới có quyền truy cập trang phân quyền.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          <div><h2 className="text-sm font-bold text-slate-800">Quản lý vai trò người dùng</h2><p className="text-xs text-slate-400 mt-1">Thay đổi vai trò sẽ ảnh hưởng trực tiếp đến quyền thêm, sửa và xóa trên các trang quản lý.</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <label className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={(event) => setFilter('searchTerm', event.target.value)} placeholder="Tìm nhân sự..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" /></label>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"><option value="ALL">Tất cả vai trò</option>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-xs">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl px-4 py-3 text-xs">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-800">Nhân sự ({visibleUsers.length})</h3></div>
          <div className="divide-y divide-slate-100">
            {visibleUsers.map((user) => {
              const currentRole = user.system_role || user.role;
              const department = departments.find((item) => String(item.id) === String(user.departmentId ?? user.department_id));
              const isCurrentAccount = String(user.id) === String(currentUser.id);
              return (
                <div key={user.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">{(user.full_name || user.name || '?').charAt(0)}</div>
                    <div className="min-w-0"><div className="text-sm font-bold text-slate-800 truncate">{user.full_name || user.name}{isCurrentAccount && <span className="ml-2 text-[10px] text-blue-600">(Tài khoản hiện tại)</span>}</div><div className="text-[11px] text-slate-400 truncate">{user.email} • {department?.name || 'Chưa có phòng ban'}</div></div>
                  </div>
                  <select
                    value={currentRole}
                    disabled={savingId === user.id || isCurrentAccount}
                    onChange={(event) => updateRole(user, event.target.value as Role)}
                    className="md:w-52 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60"
                    title={isCurrentAccount ? 'Không thể tự thay đổi vai trò tài khoản hiện tại' : undefined}
                  >
                    {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </div>
              );
            })}
            {!visibleUsers.length && <div className="py-16 text-center text-xs text-slate-400">Không tìm thấy nhân sự phù hợp.</div>}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800">Mô tả vai trò</h3>
          <div className="space-y-3 mt-4">
            {roles.map((role) => (
              <div key={role.value} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Check className="w-3.5 h-3.5 text-blue-600" />{role.label}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-5">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

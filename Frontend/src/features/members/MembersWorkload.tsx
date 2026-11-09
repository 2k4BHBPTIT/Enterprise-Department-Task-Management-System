import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { taskApi } from '../../services/api/task.api';
import { Department, Task, User } from '../../types';
import { useAuthStore } from '../../store/auth.store';

type LocalStaffProfile = {
  dateOfBirth: string;
  specialization: string;
  education: string;
  experienceYears: string;
  salary: string;
  skills: string;
  phone: string;
  address: string;
};

const getStoredProfiles = (): Record<string, LocalStaffProfile> => {
  try { return JSON.parse(localStorage.getItem('staffProfiles') || '{}'); } catch { return {}; }
};

const getLocalProfile = (user: User): LocalStaffProfile => {
  const stored = getStoredProfiles()[String(user.id)];
  return stored || {
    dateOfBirth: String(user.date_of_birth || ''),
    specialization: user.specialization || '',
    education: user.education || '',
    experienceYears: String(user.experience_years || 0),
    salary: user.salary ? String(user.salary) : '',
    skills: (user.skills || []).join(', '),
    phone: user.phone || '',
    address: user.address || '',
  };
};

const saveLocalProfile = (userId: number | string, form: typeof emptyForm) => {
  const profiles = getStoredProfiles();
  profiles[String(userId)] = {
    dateOfBirth: form.dateOfBirth,
    specialization: form.specialization,
    education: form.education,
    experienceYears: form.experienceYears,
    salary: form.salary,
    skills: form.skills,
    phone: form.phone,
    address: form.address,
  };
  localStorage.setItem('staffProfiles', JSON.stringify(profiles));
};

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  departmentId: '',
  systemRole: 'EMPLOYEE',
  dateOfBirth: '',
  specialization: '',
  education: '',
  experienceYears: '0',
  salary: '',
  skills: '',
  phone: '',
  address: '',
};

export const MembersWorkload: React.FC = () => {
  const { canManageStaff } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [advancedSearch, setAdvancedSearch] = useState('');
  const [cvStatus, setCvStatus] = useState('');

  const loadData = async () => {
    const [userData, departmentData, taskData] = await Promise.all([userApi.getUsers(), departmentApi.getDepartments(), taskApi.getTasks()]);
    setUsers(userData);
    setDepartments(departmentData);
    setTasks(taskData);
  };

  useEffect(() => { loadData().catch(() => undefined); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setCvStatus('');
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      fullName: user.full_name || user.name,
      email: user.email,
      password: '',
      departmentId: String(user.departmentId || user.department_id || ''),
      systemRole: user.system_role || user.role,
      dateOfBirth: String(user.date_of_birth || ''),
      specialization: user.specialization || '',
      education: user.education || '',
      experienceYears: String(user.experience_years || 0),
      salary: user.salary ? String(user.salary) : '',
      skills: (user.skills || []).join(', '),
      phone: user.phone || '',
      address: user.address || '',
    });
    setIsFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editingUser) {
      await userApi.updateUser(editingUser.id, {
        fullName: form.fullName,
        email: form.email,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        systemRole: form.systemRole,
      });
    } else {
      await userApi.createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        systemRole: form.systemRole,
      });
    }
    setIsFormOpen(false);
    await loadData();
    saveLocalProfile(editingUser?.id || 'draft', form);
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Xóa nhân sự "${user.full_name || user.name}"?`)) return;
    await userApi.deleteUser(user.id);
    await loadData();
  };

  const visibleUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.full_name || user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === 'ALL' || String(user.departmentId || user.department_id) === departmentFilter;
    const haystack = `${user.full_name || user.name} ${user.email} ${getLocalProfile(user).education} ${getLocalProfile(user).specialization} ${getLocalProfile(user).skills}`.toLowerCase();
    const matchesAdvanced = !advancedSearch.trim() || haystack.includes(advancedSearch.trim().toLowerCase());
    return matchesSearch && matchesDepartment && matchesAdvanced;
  }), [users, search, departmentFilter, advancedSearch]);

  const analyzeCv = async (file?: File) => {
    if (!file) return;
    const text = await file.text().catch(() => '');
    const lower = text.toLowerCase();
    const degree = /kỹ sư|engineer|thạc sĩ|master|cử nhân/.exec(lower)?.[0] || '';
    const specialization = /cntt|information technology|it/.test(lower) ? 'Công nghệ thông tin' : '';
    const experience = /(\d+)\s*(năm|year)/.exec(lower);
    setForm((current) => ({
      ...current,
      education: degree ? `${degree}${specialization ? ' CNTT' : ''}` : current.education,
      specialization: specialization || current.specialization,
      experienceYears: experience ? experience[1] : current.experienceYears,
      skills: current.skills || ['React', 'JavaScript', 'SQL'].filter((skill) => lower.includes(skill.toLowerCase())).join(', '),
    }));
    setCvStatus(`Đã trích xuất ${file.name}. Vui lòng kiểm tra lại trước khi lưu.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-800">Nhân sự và khối lượng công việc</h2><p className="text-xs text-slate-400 mt-1">Quản lý tài khoản, phòng ban, công việc đang phụ trách và tình trạng quá hạn</p></div>
          {canManageStaff() && <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"><Plus className="w-4 h-4" />Thêm nhân sự</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <label className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc email..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" /></label>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"><option value="ALL">Tất cả phòng ban</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">Tìm kiếm nâng cao (bằng cấp, chuyên môn, kỹ năng)</span>
          <input value={advancedSearch} onChange={(event) => setAdvancedSearch(event.target.value)} placeholder='Ví dụ: "kỹ sư CNTT", React, chứng chỉ...' className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-400" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleUsers.map((user) => {
          const userTasks = tasks.filter((task) => String(task.assigneeId ?? task.assignee_id) === String(user.id));
          const active = userTasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status)).length;
          const overdue = userTasks.filter((task) => task.status === 'OVERDUE' || (task.overdueDays || 0) > 0).length;
          const completed = userTasks.filter((task) => task.status === 'COMPLETED').length;
          const completion = userTasks.length ? Math.round(completed / userTasks.length * 100) : 0;
          return (
            <div key={user.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{(user.full_name || user.name || '?').charAt(0)}</div><div className="min-w-0"><div className="text-sm font-bold text-slate-800 truncate">{user.full_name || user.name}</div><div className="text-[11px] text-slate-400 truncate">{user.email}</div></div></div>
                <div className="flex gap-1">
                  <button title="Xem chi tiết và công việc đang làm" onClick={() => setSelectedUser(user)} className="p-1.5 rounded-lg hover:bg-blue-50"><Eye className="w-3.5 h-3.5 text-blue-600" /></button>
                  {canManageStaff() && <><button title="Sửa nhân sự" onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button><button title="Xóa nhân sự" onClick={() => deleteUser(user)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button></>}
                </div>
              </div>
              <div className="flex gap-2 mt-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{user.system_role || user.role}</span><span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600">{user.departmentName || user.department_name || 'Chưa có phòng ban'}</span></div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[['Đang làm', active, 'text-blue-600'], ['Quá hạn', overdue, 'text-red-600'], ['Hoàn thành', completed, 'text-emerald-600']].map(([label, value, color]) => <div key={String(label)} className="bg-slate-50 rounded-2xl p-2"><div className={`text-lg font-bold ${color}`}>{value as number}</div><div className="text-[10px] text-slate-400">{String(label)}</div></div>)}
              </div>
              <div className="mt-4"><div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Hoàn thành công việc</span><b>{completion}%</b></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completion}%` }} /></div></div>
              {(() => {
                const profile = getLocalProfile(user);
                const activeTasks = userTasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status));
                return <div className="mt-3 border-t border-slate-100 pt-3"><div className="text-[10px] text-slate-400">{profile.specialization || 'Chưa cập nhật chuyên môn'} • {profile.experienceYears || 0} năm kinh nghiệm</div><div className="mt-1 truncate text-[10px] font-medium text-slate-600">{activeTasks[0] ? `Đang làm: ${activeTasks[0].title}` : 'Hiện không có công việc đang thực hiện'}</div></div>;
              })()}
            </div>
          );
        })}
      </div>
      {!visibleUsers.length && <div className="bg-white rounded-3xl p-16 text-center text-sm text-slate-400"><Users className="w-8 h-8 mx-auto mb-2" />Không tìm thấy nhân sự phù hợp.</div>}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={() => setSelectedUser(null)}>
          <div onMouseDown={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between"><div><h3 className="text-base font-bold text-slate-800">{selectedUser.full_name || selectedUser.name}</h3><p className="mt-1 text-xs text-slate-400">{selectedUser.email}</p></div><button onClick={() => setSelectedUser(null)} className="text-xl text-slate-400">×</button></div>
            {(() => {
              const profile = getLocalProfile(selectedUser);
              const employeeTasks = tasks.filter((task) => String(task.assigneeId ?? task.assignee_id) === String(selectedUser.id));
              return <><div className="mt-5 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">{[['Bằng cấp', profile.education || '-'], ['Chuyên môn', profile.specialization || '-'], ['Kinh nghiệm', `${profile.experienceYears || 0} năm`], ['Kỹ năng', profile.skills || '-']].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">{label}</div><div className="mt-1 font-semibold text-slate-700">{value}</div></div>)}</div><div className="mt-5"><h4 className="text-xs font-bold text-slate-800">Công việc nhân sự đang phụ trách</h4><div className="mt-2 divide-y divide-slate-100">{employeeTasks.map((task) => <div key={task.id} className="flex items-center justify-between py-3 text-xs"><div><div className="font-semibold text-slate-700">{task.title}</div><div className="mt-1 text-[10px] text-slate-400">{task.projectName || task.project_name || 'Không xác định dự án'} • hạn {String(task.deadline || task.dueDate).slice(0, 10)}</div></div><span className={`rounded-full px-2 py-1 text-[10px] ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{task.status}</span></div>)}</div>{!employeeTasks.length && <div className="py-8 text-center text-xs text-slate-400">Nhân sự chưa có công việc.</div>}</div></>;
            })()}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onMouseDown={() => setIsFormOpen(false)}>
          <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">{editingUser ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}</h3>
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 text-xs font-semibold text-blue-700"><Upload className="h-4 w-4" />Tải CV để AI trích xuất thông tin<input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(event) => analyzeCv(event.target.files?.[0])} /></label>
            {cvStatus && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">{cvStatus}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">Họ tên<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl text-slate-800" /></label>
              <label className="text-xs text-slate-500">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl text-slate-800" /></label>
              {!editingUser && <label className="text-xs text-slate-500">Mật khẩu<input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl text-slate-800" /></label>}
              <label className="text-xs text-slate-500">Phòng ban<select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl"><option value="">Không chọn</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              <label className="text-xs text-slate-500 md:col-span-2">Vai trò<select value={form.systemRole} onChange={(event) => setForm({ ...form, systemRole: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl"><option value="EMPLOYEE">Employee</option><option value="PROJECT_LEADER">Project Leader</option><option value="PROJECT_MANAGER">Project Manager</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></label>
              <label className="text-xs text-slate-500">Ngày sinh<input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Bằng cấp / đào tạo<input value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} placeholder="Kỹ sư CNTT..." className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Chuyên môn<input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Số năm kinh nghiệm<input type="number" min="0" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Mức lương (VNĐ)<input type="number" min="0" value={form.salary} onChange={(event) => setForm({ ...form, salary: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500 md:col-span-2">Kỹ năng (phân cách bằng dấu phẩy)<input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Java, React, SQL..." className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500 md:col-span-2">Địa chỉ<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Hủy</button><button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">Lưu</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

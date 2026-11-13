import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, LoaderCircle, Plus, Search, ShieldCheck, Trash2, Upload, Users } from 'lucide-react';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { taskApi } from '../../services/api/task.api';
import { Department, Task, User } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { PermissionManagement } from '../permissions/PermissionManagement';
import { extractCvProfile } from './cv-extractor';

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
  const { canManageStaff, isAdmin } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'staff' | 'create' | 'permissions'>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [advancedSearch, setAdvancedSearch] = useState('');
  const [staffError, setStaffError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [cvStatus, setCvStatus] = useState('');
  const [cvStatusType, setCvStatusType] = useState<'success' | 'error'>('success');
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const [cvSourceText, setCvSourceText] = useState('');

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
    setCvSourceText('');
    setActiveSection('create');
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
    setCvStatus('');
    setCvSourceText('');
    setIsFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    let savedUserId = editingUser?.id;
    if (editingUser) {
      await userApi.updateUser(editingUser.id, {
        fullName: form.fullName,
        email: form.email,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        systemRole: form.systemRole,
      });
    } else {
      const createdUser = await userApi.createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        systemRole: form.systemRole,
      });
      savedUserId = createdUser.id;
    }
    setIsFormOpen(false);
    await loadData();
    if (savedUserId !== undefined) saveLocalProfile(savedUserId, form);
    if (!editingUser) setActiveSection('staff');
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Ngừng hoạt động tài khoản của "${user.full_name || user.name}"? Tài khoản sẽ không còn hiển thị trong danh sách nhân sự.`)) return;
    setStaffError('');
    setDeletingUserId(String(user.id));
    try {
      await userApi.deleteUser(user.id);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => String(currentUser.id) !== String(user.id)));
      if (String(selectedUser?.id) === String(user.id)) setSelectedUser(null);
    } catch (error) {
      setStaffError(error instanceof Error ? error.message : 'Không thể ngừng hoạt động nhân sự. Vui lòng thử lại.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const visibleUsers = useMemo(() => users.filter((user) => user.status === 'ACTIVE').filter((user) => {
    const matchesSearch = `${user.full_name || user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === 'ALL' || String(user.departmentId || user.department_id) === departmentFilter;
    const matchesRole = roleFilter === 'ALL' || (user.system_role || user.role) === roleFilter;
    const haystack = `${user.full_name || user.name} ${user.email} ${getLocalProfile(user).education} ${getLocalProfile(user).specialization} ${getLocalProfile(user).skills}`.toLowerCase();
    const matchesAdvanced = !advancedSearch.trim() || haystack.includes(advancedSearch.trim().toLowerCase());
    return matchesSearch && matchesDepartment && matchesRole && matchesAdvanced;
  }), [users, search, departmentFilter, roleFilter, advancedSearch]);

  const analyzeCv = async (file?: File) => {
    if (!file) return;
    setCvStatus('');
    setIsExtractingCv(true);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('CV vượt quá dung lượng 10 MB.');
      }
      setCvStatusType('success');
      setCvStatus('Đang đọc CV...');
      const result = await extractCvProfile(file, setCvStatus);
      const extracted = result.profile;
      setCvSourceText(result.sourceText);
      const extractedFields = Object.entries(extracted).filter(([, value]) => Boolean(value?.trim()));
      if (extractedFields.length === 0) {
        setCvStatusType('error');
        setCvStatus('Đã đọc được CV nhưng chưa nhận diện chắc chắn trường nào. Bạn có thể xem văn bản trích xuất bên dưới và nhập/chỉnh sửa thông tin thủ công.');
        return;
      }

      const currentValueIsEmpty = (value: string) => !value.trim() || value.trim() === '0';
      setForm((current) => ({
        ...current,
        fullName: currentValueIsEmpty(current.fullName) ? extracted.fullName || current.fullName : current.fullName,
        email: currentValueIsEmpty(current.email) ? extracted.email || current.email : current.email,
        phone: currentValueIsEmpty(current.phone) ? extracted.phone || current.phone : current.phone,
        dateOfBirth: currentValueIsEmpty(current.dateOfBirth) ? extracted.dateOfBirth || current.dateOfBirth : current.dateOfBirth,
        education: currentValueIsEmpty(current.education) ? extracted.education || current.education : current.education,
        specialization: currentValueIsEmpty(current.specialization) ? extracted.specialization || current.specialization : current.specialization,
        experienceYears: currentValueIsEmpty(current.experienceYears) ? extracted.experienceYears || current.experienceYears : current.experienceYears,
        skills: currentValueIsEmpty(current.skills) ? extracted.skills || current.skills : current.skills,
        address: currentValueIsEmpty(current.address) ? extracted.address || current.address : current.address,
      }));
      setCvStatusType('success');
      setCvStatus(`Đã nhận diện ${extractedFields.length} trường từ ${file.name}. Hãy đối chiếu với CV và chỉnh lại nếu chưa chính xác; trường đang có dữ liệu không bị ghi đè.`);
    } catch (error) {
      setCvStatusType('error');
      setCvStatus(error instanceof Error ? error.message : 'Không thể trích xuất nội dung CV.');
    } finally {
      setIsExtractingCv(false);
    }
  };

  const sectionTabs = (
    <div role="tablist" aria-label="Quản lý nhân sự" className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'staff'}
        onClick={() => setActiveSection('staff')}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeSection === 'staff' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <Users className="h-4 w-4" aria-hidden="true" />
        Nhân sự
      </button>
      {canManageStaff() && (
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'create'}
          onClick={openCreate}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeSection === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm nhân sự
        </button>
      )}
      {isAdmin() && (
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'permissions'}
          onClick={() => setActiveSection('permissions')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeSection === 'permissions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Phân quyền
        </button>
      )}
    </div>
  );

  if (activeSection === 'permissions' && isAdmin()) {
    return (
      <div className="space-y-4">
        {sectionTabs}
        <PermissionManagement />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionTabs}
      <div className={activeSection === 'create' ? 'hidden' : 'contents'}>
      {staffError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{staffError}</div>}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold text-slate-800">Danh sách nhân viên</h2><p className="mt-1 text-[11px] text-slate-400">Hồ sơ và danh sách nhân viên đang hoạt động</p></div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{visibleUsers.length} nhân sự</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm theo tên, phòng ban..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400" />
            </label>
            <select aria-label="Lọc phòng ban" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <select aria-label="Lọc vai trò" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <option value="ALL">Tất cả vai trò</option>
              {['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'PROJECT_LEADER', 'EMPLOYEE'].map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Tìm kiếm nâng cao bằng cấp, chuyên môn, kỹ năng</span>
            <input value={advancedSearch} onChange={(event) => setAdvancedSearch(event.target.value)} placeholder="Tìm theo bằng cấp, chuyên môn hoặc kỹ năng..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-400" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Họ và tên</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phòng ban</th>
                <th className="px-4 py-3 font-semibold">Chức vụ</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => {
                const profile = getLocalProfile(user);
                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => setSelectedUser(user)} className="flex items-center gap-2.5 text-left">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{(user.full_name || user.name || '?').charAt(0)}</span>
                        <span className="font-semibold text-slate-800">{user.full_name || user.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3.5 text-slate-600">{user.departmentName || user.department_name || 'Chưa có phòng ban'}</td>
                    <td className="px-4 py-3.5 text-slate-600">{profile.specialization || '—'}</td>
                    <td className="px-4 py-3.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{(user.system_role || user.role).replace(/_/g, ' ')}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button type="button" title="Xem chi tiết" aria-label={`Xem ${user.full_name || user.name}`} onClick={() => setSelectedUser(user)} className="rounded-lg p-1.5 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-blue-600" /></button>
                        {canManageStaff() && <>
                          <button type="button" title="Sửa nhân sự" aria-label={`Sửa ${user.full_name || user.name}`} onClick={() => openEdit(user)} className="rounded-lg p-1.5 hover:bg-blue-50"><Edit2 className="h-3.5 w-3.5 text-blue-600" /></button>
                          <button type="button" title={deletingUserId === String(user.id) ? 'Đang ngừng hoạt động' : 'Ngừng hoạt động'} aria-label={`Ngừng hoạt động ${user.full_name || user.name}`} disabled={deletingUserId === String(user.id)} onClick={() => deleteUser(user)} className="rounded-lg p-1.5 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50">{deletingUserId === String(user.id) ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-red-500" /> : <Trash2 className="h-3.5 w-3.5 text-red-500" />}</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visibleUsers.length && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-400"><Users className="mx-auto mb-2 h-7 w-7" />Không tìm thấy nhân sự phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

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
      </div>

      {(isFormOpen || (activeSection === 'create' && canManageStaff())) && (
        <div className={activeSection === 'create' ? 'rounded-3xl border border-slate-100 bg-white p-5 shadow-sm' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4'} onMouseDown={() => {
          if (activeSection !== 'create') setIsFormOpen(false);
        }}>
          <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className={`w-full ${activeSection === 'create' ? 'space-y-4' : 'max-w-lg space-y-4 rounded-3xl bg-white p-5 shadow-xl'}`}>
            <h3 className="text-sm font-bold text-slate-800">{editingUser ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}</h3>
            <label className={`flex items-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-xs font-semibold ${isExtractingCv ? 'cursor-wait border-slate-200 bg-slate-50 text-slate-500' : 'cursor-pointer border-blue-200 bg-blue-50/50 text-blue-700'}`}>
              {isExtractingCv ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isExtractingCv ? 'Đang đọc và trích xuất CV...' : 'Tải CV để tự động điền thông tin'}
              <input type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp" className="hidden" disabled={isExtractingCv} onChange={(event) => {
                void analyzeCv(event.target.files?.[0]);
                event.currentTarget.value = '';
              }} />
            </label>
            <p className="text-[10px] text-slate-400">Hỗ trợ PDF có văn bản hoặc scan, DOCX, TXT và ảnh PNG/JPG/WEBP (tối đa 10 MB, 20 trang cần OCR). OCR tiếng Việt–Anh xử lý trên trình duyệt; cần mạng để tải bộ máy và dữ liệu ngôn ngữ lần đầu.</p>
            {cvStatus && <div role={cvStatusType === 'error' ? 'alert' : 'status'} className={`rounded-xl px-3 py-2 text-[11px] ${cvStatusType === 'error' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{cvStatus}</div>}
            {cvSourceText && (
              <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">Xem văn bản OCR để đối chiếu</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-4 text-slate-600">{cvSourceText}</pre>
              </details>
            )}
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
            <div className="flex justify-end gap-2"><button type="button" onClick={() => {
              if (editingUser) setIsFormOpen(false);
              else setActiveSection('staff');
            }} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold">Hủy</button><button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">Lưu</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

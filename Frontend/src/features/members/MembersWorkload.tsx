import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarClock, Edit2, Eye, FileText, LoaderCircle, Plus, Search, ShieldCheck, Trash2, Upload, Users } from 'lucide-react';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { projectApi } from '../../services/api/project.api';
import { ProjectMember, projectMemberApi } from '../../services/api/project-member.api';
import { Department, User } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';
import { PermissionManagement } from '../permissions/PermissionManagement';
import { extractCvProfile } from './cv-extractor';

type LocalStaffProfile = {
  dateOfBirth: string;
  specialization: string;
  education: string;
  experienceYears: string;
  skills: string;
  phone: string;
  address: string;
};

type EmployeeProject = ProjectMember & { projectName: string };

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
  skills: '',
  phone: '',
  address: '',
};

export const MembersWorkload: React.FC = () => {
  const { canManageStaff, isAdmin, dashboardMode, setDashboardMode, setActiveTab } = useAuthStore();
  const setFilter = useFilterStore((state) => state.setFilter);
  const [activeSection, setActiveSection] = useState<'staff' | 'create' | 'permissions'>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [detailTab, setDetailTab] = useState<'profile' | 'attendance' | 'projects' | 'payroll'>('profile');
  const [employeeProjects, setEmployeeProjects] = useState<EmployeeProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [staffError, setStaffError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [cvStatus, setCvStatus] = useState('');
  const [cvStatusType, setCvStatusType] = useState<'success' | 'error'>('success');
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const [cvSourceText, setCvSourceText] = useState('');

  const loadData = async () => {
    const [userData, departmentData] = await Promise.all([userApi.getUsers(), departmentApi.getDepartments()]);
    setUsers(userData);
    setDepartments(departmentData);
  };

  useEffect(() => { loadData().catch(() => undefined); }, []);

  useEffect(() => {
    if (!selectedUser || detailTab !== 'projects') return;
    let active = true;
    setEmployeeProjects([]);
    setProjectsError('');
    setProjectsLoading(true);
    projectApi.getProjects()
      .then(async (projects) => {
        const memberships = await Promise.all(projects.map((project) => projectMemberApi.getMembers(project.id)));
        if (active) {
          setEmployeeProjects(memberships.flatMap((projectMembers, index) => projectMembers
            .filter((member) => String(member.userId) === String(selectedUser.id))
            .map((member) => ({ ...member, projectName: projects[index].name }))));
        }
      })
      .catch((error) => {
        if (active) setProjectsError(error instanceof Error ? error.message : 'Không thể tải dự án tham gia.');
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => { active = false; };
  }, [selectedUser?.id, detailTab]);

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
    return matchesSearch && matchesDepartment && matchesRole;
  }), [users, search, departmentFilter, roleFilter]);

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
      {isAdmin() && dashboardMode !== 'HR' && (
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
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
              {['ADMIN', 'MANAGER', 'EMPLOYEE'].map((role) => <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>)}
            </select>
            <label>
              <span className="sr-only">Lọc trạng thái làm việc</span>
              <select aria-label="Lọc trạng thái làm việc" disabled value="PENDING" className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500">
                <option value="PENDING">Trạng thái làm việc · Chờ API</option>
                <option value="WORKING">Đang làm</option>
                <option value="PROBATION">Thử việc</option>
                <option value="ON_LEAVE">Nghỉ phép</option>
                <option value="PAUSED">Tạm nghỉ</option>
                <option value="RESIGNED">Đã nghỉ việc</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Trạng thái làm việc riêng (đang làm, thử việc, nghỉ phép, tạm nghỉ, đã nghỉ việc) sẽ lọc được sau khi backend bổ sung trường dữ liệu.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Mã nhân sự (ID)</th>
                <th className="px-5 py-3 font-semibold">Họ và tên</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phòng ban</th>
                <th className="px-4 py-3 font-semibold">Chức vụ chuyên môn</th>
                <th className="px-4 py-3 font-semibold">Chuyên môn (CV)</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-4 py-3 font-semibold">Trạng thái làm việc</th>
                <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => {
                const profile = getLocalProfile(user);
                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-slate-500">{user.id}</td>
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => { setSelectedUser(user); setDetailTab('profile'); }} className="flex items-center gap-2.5 text-left">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{(user.full_name || user.name || '?').charAt(0)}</span>
                        <span className="font-semibold text-slate-800">{user.full_name || user.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3.5 text-slate-600">{user.departmentName || user.department_name || 'Chưa có phòng ban'}</td>
                    <td className="px-4 py-3.5"><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">Chờ API</span></td>
                    <td className="px-4 py-3.5 text-slate-600">{profile.specialization || '—'}</td>
                    <td className="px-4 py-3.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{(user.system_role || user.role).replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3.5"><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">Chờ API</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button type="button" title="Xem chi tiết" aria-label={`Xem ${user.full_name || user.name}`} onClick={() => { setSelectedUser(user); setDetailTab('profile'); }} className="rounded-lg p-1.5 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-blue-600" /></button>
                        {canManageStaff() && <>
                          <button type="button" title="Sửa nhân sự" aria-label={`Sửa ${user.full_name || user.name}`} onClick={() => openEdit(user)} className="rounded-lg p-1.5 hover:bg-blue-50"><Edit2 className="h-3.5 w-3.5 text-blue-600" /></button>
                          <button type="button" title={deletingUserId === String(user.id) ? 'Đang ngừng hoạt động' : 'Ngừng hoạt động'} aria-label={`Ngừng hoạt động ${user.full_name || user.name}`} disabled={deletingUserId === String(user.id)} onClick={() => deleteUser(user)} className="rounded-lg p-1.5 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50">{deletingUserId === String(user.id) ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-red-500" /> : <Trash2 className="h-3.5 w-3.5 text-red-500" />}</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visibleUsers.length && <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-400"><Users className="mx-auto mb-2 h-7 w-7" />Không tìm thấy nhân sự phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={() => setSelectedUser(null)}>
          <div onMouseDown={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">{(selectedUser.full_name || selectedUser.name || '?').charAt(0)}</div>
                <div><h3 className="text-base font-bold text-slate-800">{selectedUser.full_name || selectedUser.name}</h3><p className="mt-1 text-xs text-slate-400">{selectedUser.email}</p></div>
              </div>
              <button type="button" aria-label="Đóng hồ sơ" onClick={() => setSelectedUser(null)} className="rounded-xl px-3 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100">×</button>
            </div>
            <div role="tablist" aria-label="Thông tin nhân sự" className="mt-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              {[
                ['profile', 'Thông tin chung'],
                ['attendance', 'Chấm công & lịch sử'],
                ['projects', 'Dự án tham gia'],
                ['payroll', 'Lương & hợp đồng'],
              ].map(([tab, label]) => (
                <button key={tab} type="button" role="tab" aria-selected={detailTab === tab} onClick={() => setDetailTab(tab as typeof detailTab)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${detailTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{label}</button>
              ))}
            </div>
            {detailTab === 'profile' && (() => {
              const profile = getLocalProfile(selectedUser);
              const department = departments.find((item) => String(item.id) === String(selectedUser.departmentId ?? selectedUser.department_id));
              const info = [
                ['Mã nhân sự (ID hệ thống)', String(selectedUser.id)],
                ['Ngày sinh', profile.dateOfBirth || 'Chưa có dữ liệu'],
                ['Giới tính', 'Chờ API'],
                ['Số điện thoại', profile.phone || 'Chưa có dữ liệu'],
                ['Email công ty', selectedUser.email],
                ['Email cá nhân', 'Chờ API'],
                ['Địa chỉ', profile.address || 'Chưa có dữ liệu'],
                ['CCCD/CMND', 'Chờ API'],
                ['Phòng ban', department?.name || 'Chưa phân phòng ban'],
                ['Chức vụ chuyên môn', 'Chờ API'],
                ['Vai trò hệ thống', (selectedUser.system_role || selectedUser.role).replace(/_/g, ' ')],
                ['Hình thức làm việc', 'Chờ API'],
                ['Ngày bắt đầu làm việc', 'Chờ API'],
                ['Trạng thái làm việc', 'Chờ API'],
                ['Bằng cấp / đào tạo', profile.education || 'Chưa có dữ liệu'],
                ['Chuyên môn trong hồ sơ', profile.specialization || 'Chưa có dữ liệu'],
                ['Kinh nghiệm', `${profile.experienceYears || 0} năm`],
                ['Kỹ năng', profile.skills || 'Chưa có dữ liệu'],
                ['Trạng thái tài khoản', selectedUser.status === 'ACTIVE' ? 'Đang hoạt động' : selectedUser.status],
              ];
              return (
                <section className="mt-5">
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-blue-700 shadow-sm">{(selectedUser.full_name || selectedUser.name || '?').charAt(0)}</div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Hồ sơ nhân sự</p><h4 className="mt-1 text-lg font-bold text-slate-800">{selectedUser.full_name || selectedUser.name}</h4><p className="text-xs text-slate-500">{department?.name || 'Chưa phân phòng ban'} · {String(selectedUser.system_role || selectedUser.role).replace(/_/g, ' ')}</p></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {info.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3"><div className="text-[10px] text-slate-400">{label}</div><div className={`mt-1 break-words text-xs font-semibold ${value === 'Chờ API' ? 'text-amber-700' : 'text-slate-700'}`}>{value}</div></div>)}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400">Các trường ghi “Chờ API” chưa được backend hỗ trợ nên hiện chưa thể nhập hoặc lưu.</p>
                </section>
              );
            })()}
            {detailTab === 'attendance' && (
              <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarClock className="h-5 w-5 text-amber-600" />Chấm công & lịch sử làm việc</div>
                <p className="mt-2 text-xs leading-5 text-slate-600">Tóm tắt ngày công, đi muộn, nghỉ phép và lịch sử check-in/check-out sẽ hiển thị sau khi tích hợp API chấm công.</p>
                <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Đang chờ API</span>
              </section>
            )}
            {detailTab === 'projects' && (
              <section className="mt-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><BriefcaseBusiness className="h-5 w-5 text-blue-600" />Dự án nhân sự tham gia</div>
                {projectsError && <div role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{projectsError}</div>}
                {projectsLoading ? <div className="py-12 text-center text-xs text-slate-400">Đang tải dự án tham gia...</div> : (
                  <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                    {employeeProjects.map((membership) => (
                      <div key={membership.projectId} className="flex flex-wrap items-center gap-3 p-4">
                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{membership.projectName}</div><div className="mt-1 text-[11px] text-slate-500">Vai trò dự án: {membership.projectRole.replace(/_/g, ' ')}</div></div>
                        <button type="button" onClick={() => { setFilter('projectId', String(membership.projectId)); setDashboardMode('PM'); setActiveTab('projects'); setSelectedUser(null); }} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Mở dự án</button>
                      </div>
                    ))}
                    {!employeeProjects.length && !projectsError && <div className="py-12 text-center text-xs text-slate-400">Nhân sự chưa tham gia dự án nào.</div>}
                  </div>
                )}
              </section>
            )}
            {detailTab === 'payroll' && (
              <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileText className="h-5 w-5 text-amber-600" />Lương & hợp đồng</div>
                <p className="mt-2 text-xs leading-5 text-slate-600">Lương cơ bản, hệ số, phụ cấp, loại hợp đồng và thời hạn hiệu lực sẽ được bổ sung khi backend có API. Dữ liệu lương hiện không được nhập hoặc lưu ở trình duyệt.</p>
                <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Đang chờ API</span>
              </section>
            )}
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
              <label className="text-xs text-slate-500 md:col-span-2">Vai trò hệ thống<select value={form.systemRole} onChange={(event) => setForm({ ...form, systemRole: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl"><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>{editingUser && ['PROJECT_MANAGER', 'PROJECT_LEADER'].includes(form.systemRole) && <option value={form.systemRole}>Vai trò cũ: {form.systemRole.replace(/_/g, ' ')} (giữ nguyên)</option>}</select></label>
              <label className="text-xs text-slate-500">Ngày sinh<input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Bằng cấp / đào tạo<input value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} placeholder="Kỹ sư CNTT..." className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Chuyên môn<input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
              <label className="text-xs text-slate-500">Số năm kinh nghiệm<input type="number" min="0" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} className="mt-1 w-full px-3 py-2 border rounded-xl" /></label>
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

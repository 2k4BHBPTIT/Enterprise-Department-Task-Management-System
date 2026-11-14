import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, Building2, Edit2, Mail, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { Department, User } from '../../types';
import { useAuthStore } from '../../store/auth.store';

type DepartmentForm = { name: string; description: string; managerId: string };
const emptyForm: DepartmentForm = { name: '', description: '', managerId: '' };

export const DepartmentManagement: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [isSavingManager, setIsSavingManager] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [departmentData, userData] = await Promise.all([departmentApi.getDepartments(), userApi.getUsers()]);
      setDepartments(departmentData);
      setUsers(userData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return departments.filter((department) =>
      !term || `${department.name} ${department.description || ''}`.toLowerCase().includes(term)
    );
  }, [departments, search]);

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setForm({
      name: department.name,
      description: department.description || '',
      managerId: String(department.manager_id || ''),
    });
    setIsFormOpen(true);
  };

  const saveDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        managerId: form.managerId ? Number(form.managerId) : undefined,
      };
      if (editing) await departmentApi.updateDepartment(editing.id, payload);
      else await departmentApi.createDepartment(payload);
      closeForm();
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu phòng ban');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDepartment = async (department: Department) => {
    if (!window.confirm(`Xóa phòng ban "${department.name}"?`)) return;
    try {
      await departmentApi.deleteDepartment(department.id);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa phòng ban');
    }
  };

  const openDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedManagerId(String(department.manager_id || ''));
    setError('');
  };

  const saveDepartmentManager = async () => {
    if (!selectedDepartment) return;
    setIsSavingManager(true);
    setError('');
    try {
      const updated = await departmentApi.updateDepartment(selectedDepartment.id, {
        name: selectedDepartment.name,
        description: selectedDepartment.description,
        managerId: selectedManagerId ? Number(selectedManagerId) : undefined,
      });
      setSelectedDepartment(updated);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật trưởng phòng');
    } finally {
      setIsSavingManager(false);
    }
  };

  const memberCount = (departmentId: number | string) =>
    users.filter((user) => user.status === 'ACTIVE' && String(user.departmentId ?? user.department_id) === String(departmentId)).length;

  const selectedUsers = selectedDepartment
    ? users.filter((user) => user.status === 'ACTIVE' && String(user.departmentId ?? user.department_id) === String(selectedDepartment.id))
    : [];

  if (selectedDepartment) {
    const managerOptions = users.filter((user) => user.status === 'ACTIVE'
      && (String(user.id) === String(selectedDepartment.manager_id)
        || ['MANAGER', 'PROJECT_MANAGER', 'PROJECT_LEADER'].includes(user.system_role || user.role)));
    const selectedManager = users.find((user) => String(user.id) === selectedManagerId);

    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <button type="button" onClick={() => setSelectedDepartment(null)} className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />Quay lại danh sách phòng ban
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 className="h-7 w-7" /></div>
              <div><h2 className="text-xl font-bold text-slate-800">{selectedDepartment.name}</h2><p className="mt-1 text-xs text-slate-400">{selectedDepartment.description || 'Chưa có mô tả'}</p></div>
            </div>
            <div className="flex gap-2">
              <div className="rounded-2xl bg-blue-50 px-4 py-3"><div className="text-[10px] text-blue-500">Nhân sự đang hoạt động</div><div className="mt-1 text-xl font-bold text-blue-700">{selectedUsers.length}</div></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><div className="text-[10px] text-slate-400">Trưởng phòng</div><div className="mt-1 text-sm font-bold text-slate-700">{selectedManager?.full_name || selectedManager?.name || selectedDepartment.managerName || 'Chưa phân công'}</div></div>
            </div>
          </div>
        </div>

        {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness className="h-5 w-5" /></div>
            <div><h3 className="text-sm font-bold text-slate-800">Chức vụ chuyên môn trong phòng ban</h3><p className="mt-1 text-xs text-slate-400">Danh mục chức danh cố định và chức danh do quản trị viên tạo.</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4">
            <p className="text-xs text-amber-800">Danh mục chức vụ dùng chung cần API backend; hiện chưa thể thêm, sửa hoặc lưu thay đổi.</p>
            <button type="button" disabled title="Chờ API quản lý chức vụ" className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">+ Thêm chức vụ · Chờ API</button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-sm font-bold text-slate-800">Trưởng phòng & quyền hạn</h3><p className="mt-1 text-xs text-slate-400">Chọn người quản lý từ các tài khoản có vai trò quản lý.</p></div>
            {isAdmin() && <div className="flex w-full gap-2 sm:w-auto">
              <select aria-label="Chọn trưởng phòng" value={selectedManagerId} onChange={(event) => setSelectedManagerId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:w-72">
                {!selectedManagerId && <option value="" disabled>Chọn trưởng phòng</option>}
                {managerOptions.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.name} · {user.email}</option>)}
              </select>
              <button type="button" onClick={saveDepartmentManager} disabled={isSavingManager || !selectedManagerId || selectedManagerId === String(selectedDepartment.manager_id || '')} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSavingManager ? 'Đang lưu...' : 'Lưu'}</button>
            </div>}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-800">Nhân sự thuộc phòng ban ({selectedUsers.length})</h3></div>
          <div className="divide-y divide-slate-100">
            {selectedUsers.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700"><UserRound className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-slate-800">{user.full_name || user.name}</div><div className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-400"><Mail className="h-3 w-3" />{user.email}</div></div>
                <div className="grid gap-2 text-right sm:grid-cols-4 sm:gap-6">
                  <div><div className="text-[10px] text-slate-400">Mã nhân sự (ID)</div><div className="mt-1 text-xs font-medium text-slate-700">{user.id}</div></div>
                  <div><div className="text-[10px] text-slate-400">Chức vụ chuyên môn</div><div className="mt-1 text-xs font-medium text-amber-700">Chờ API</div></div>
                  <div><div className="text-[10px] text-slate-400">Chuyên môn (CV)</div><div className="mt-1 text-xs font-medium text-slate-700">{user.specialization || '—'}</div></div>
                  <div><div className="text-[10px] text-slate-400">Vai trò hệ thống / trạng thái</div><div className="mt-1 text-xs font-medium text-slate-700">{(user.system_role || user.role).replace(/_/g, ' ')} · Tài khoản hoạt động</div><div className="mt-1 text-[10px] text-amber-700">Trạng thái làm việc: Chờ API</div></div>
                </div>
              </div>
            ))}
            {!selectedUsers.length && <div className="py-14 text-center text-xs text-slate-400">Phòng ban chưa có nhân sự đang hoạt động.</div>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-800">Phòng ban</h2><p className="text-xs text-slate-400 mt-1">Cơ cấu tổ chức và nhân sự theo phòng ban</p></div>
          {isAdmin() && <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"><Plus className="w-4 h-4" />Thêm phòng ban</button>}
        </div>
        <label className="relative mt-4 block max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm phòng ban..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400" /></label>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-xs">{error}</div>}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-sm text-slate-400">Đang tải phòng ban...</div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-800">Danh sách phòng ban</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên phòng ban</th>
                  <th className="px-4 py-3 font-semibold">Trưởng phòng</th>
                  <th className="px-4 py-3 text-center font-semibold">Danh mục chức vụ</th>
                  <th className="px-4 py-3 text-center font-semibold">Số nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Tình trạng nhân sự</th>
                  {isAdmin() && <th className="px-5 py-3 text-right font-semibold">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map((department) => {
                  const manager = users.find((user) => String(user.id) === String(department.manager_id));
                  const count = memberCount(department.id);
                  return (
                    <tr key={department.id} className="cursor-pointer transition hover:bg-slate-50/70" onClick={() => openDepartment(department)}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-4 w-4" /></span><span><span className="block font-semibold text-slate-800">{department.name}</span><span className="mt-0.5 block max-w-xs truncate text-[10px] text-slate-400">{department.description || 'Chưa có mô tả'}</span></span></div></td>
                      <td className="px-4 py-3.5 text-slate-600">{manager?.full_name || manager?.name || department.managerName || '—'}</td>
                      <td className="px-4 py-3.5 text-center text-amber-700">Chờ API</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">{count}</td>
                      <td className="px-4 py-3.5"><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${count ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{count ? 'Có nhân sự' : 'Chưa có nhân sự'}</span></td>
                      {isAdmin() && (
                        <td className="px-5 py-3.5" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button title="Sửa phòng ban" onClick={() => openEdit(department)} className="rounded-lg p-1.5 hover:bg-blue-50"><Edit2 className="h-3.5 w-3.5 text-blue-600" /></button>
                            <button title="Xóa phòng ban" onClick={() => deleteDepartment(department)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {!filteredDepartments.length && <tr><td colSpan={isAdmin() ? 6 : 5} className="px-5 py-14 text-center text-slate-400"><Building2 className="mx-auto mb-2 h-7 w-7" />Không tìm thấy phòng ban.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onMouseDown={closeForm}>
          <form onSubmit={saveDepartment} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">{editing ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}</h3><button type="button" onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <label className="block text-xs text-slate-500">Tên phòng ban<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400" /></label>
            <label className="block text-xs text-slate-500">Mô tả<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 resize-none" /></label>
            <label className="block text-xs text-slate-500">Trưởng phòng<select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"><option value="">Không chọn</option>{users.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.name} - {user.email}</option>)}</select></label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={closeForm} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button><button disabled={isSaving} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold disabled:opacity-60">{isSaving ? 'Đang lưu...' : 'Lưu phòng ban'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

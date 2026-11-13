import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Edit2, Mail, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
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

  const memberCount = (departmentId: number | string) =>
    users.filter((user) => user.status === 'ACTIVE' && String(user.departmentId ?? user.department_id) === String(departmentId)).length;

  const selectedUsers = selectedDepartment
    ? users.filter((user) => user.status === 'ACTIVE' && String(user.departmentId ?? user.department_id) === String(selectedDepartment.id))
    : [];

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
                  <th className="px-4 py-3 text-center font-semibold">Số chức vụ</th>
                  <th className="px-4 py-3 text-center font-semibold">Số nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Tình trạng nhân sự</th>
                  {isAdmin() && <th className="px-5 py-3 text-right font-semibold">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map((department) => {
                  const manager = users.find((user) => String(user.id) === String(department.manager_id));
                  const roleCount = new Set(users.filter((user) => user.status === 'ACTIVE' && String(user.departmentId ?? user.department_id) === String(department.id)).map((user) => user.system_role || user.role)).size;
                  const count = memberCount(department.id);
                  return (
                    <tr key={department.id} className="cursor-pointer transition hover:bg-slate-50/70" onClick={() => setSelectedDepartment(department)}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-4 w-4" /></span><span><span className="block font-semibold text-slate-800">{department.name}</span><span className="mt-0.5 block max-w-xs truncate text-[10px] text-slate-400">{department.description || 'Chưa có mô tả'}</span></span></div></td>
                      <td className="px-4 py-3.5 text-slate-600">{manager?.full_name || manager?.name || department.managerName || '—'}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600">{roleCount}</td>
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

      {selectedDepartment && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex justify-end" onMouseDown={() => setSelectedDepartment(null)}>
          <aside onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button onClick={() => setSelectedDepartment(null)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">
                <ArrowLeft className="w-4 h-4" />Quay lại danh sách
              </button>
              <button onClick={() => setSelectedDepartment(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
                <div><h3 className="text-lg font-bold text-slate-800">{selectedDepartment.name}</h3><p className="text-xs text-slate-400">{selectedDepartment.description || 'Chưa có mô tả'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-slate-50 rounded-2xl p-4"><div className="text-[11px] text-slate-400">Tổng nhân sự</div><div className="text-2xl font-bold text-slate-800 mt-1">{selectedUsers.length}</div></div>
                <div className="bg-slate-50 rounded-2xl p-4"><div className="text-[11px] text-slate-400">Trưởng phòng</div><div className="text-sm font-bold text-slate-700 mt-2">{users.find((user) => String(user.id) === String(selectedDepartment.manager_id))?.full_name || selectedDepartment.managerName || '-'}</div></div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-6 mb-3">Nhân sự phòng ban ({selectedUsers.length})</h4>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
                    <div className="min-w-0 flex-1"><div className="text-sm font-bold text-slate-800 truncate">{user.full_name || user.name}</div><div className="text-[11px] text-slate-400 flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{user.email}</div></div>
                    <div className="text-right"><span className="px-2 py-1 rounded-full text-[10px] bg-slate-100 text-slate-600">{user.system_role || user.role}</span><div className={`text-[10px] mt-1 ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>{user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status}</div></div>
                  </div>
                ))}
                {!selectedUsers.length && <div className="py-14 text-center text-xs text-slate-400">Phòng ban chưa có nhân sự.</div>}
              </div>
            </div>
          </aside>
        </div>
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

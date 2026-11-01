import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Edit2, Mail, Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react';
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
    users.filter((user) => String(user.departmentId ?? user.department_id) === String(departmentId)).length;

  const selectedUsers = selectedDepartment
    ? users.filter((user) => String(user.departmentId ?? user.department_id) === String(selectedDepartment.id))
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-800">Danh sách phòng ban</h2><p className="text-xs text-slate-400 mt-1">Quản lý cơ cấu phòng ban và trưởng phòng</p></div>
          {isAdmin() && <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"><Plus className="w-4 h-4" />Thêm phòng ban</button>}
        </div>
        <label className="relative block mt-4 max-w-md"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm phòng ban..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400" /></label>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-xs">{error}</div>}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-sm text-slate-400">Đang tải phòng ban...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => {
            const manager = users.find((user) => String(user.id) === String(department.manager_id));
            return (
              <article
                key={department.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDepartment(department)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedDepartment(department);
                }}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                  {isAdmin() && (
                    <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                      <button title="Sửa phòng ban" onClick={() => openEdit(department)} className="p-2 rounded-xl hover:bg-blue-50"><Edit2 className="w-4 h-4 text-blue-600" /></button>
                      <button title="Xóa phòng ban" onClick={() => deleteDepartment(department)} className="p-2 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-4">{department.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-8">{department.description || 'Chưa có mô tả'}</p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50 rounded-2xl p-3"><div className="flex items-center gap-1 text-[10px] text-slate-400"><Users className="w-3.5 h-3.5" />Nhân sự</div><div className="text-xl font-bold text-slate-800 mt-1">{memberCount(department.id)}</div></div>
                  <div className="bg-slate-50 rounded-2xl p-3"><div className="text-[10px] text-slate-400">Trưởng phòng</div><div className="text-xs font-bold text-slate-700 mt-2 truncate">{manager?.full_name || manager?.name || department.managerName || '-'}</div></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!loading && !filteredDepartments.length && <div className="bg-white rounded-3xl p-16 text-center text-sm text-slate-400"><Building2 className="w-8 h-8 mx-auto mb-2" />Không tìm thấy phòng ban.</div>}

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

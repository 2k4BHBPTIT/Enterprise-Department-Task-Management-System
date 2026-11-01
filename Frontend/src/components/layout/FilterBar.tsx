import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, RefreshCw } from 'lucide-react';
import { useFilterStore } from '../../store/filter.store';
import { projectApi } from '../../services/api/project.api';
import { userApi } from '../../services/api/user.api';
import { departmentApi } from '../../services/api/department.api';
import { Project, User, Department } from '../../types';

interface FilterBarProps {
  onReload?: () => void;
  title: string;
  subtitle: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onReload, title, subtitle }) => {
  const { filters, setFilter, resetFilters } = useFilterStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const reloadCurrentPage = () => {
    window.dispatchEvent(new Event('app:reload'));
    onReload?.();
  };

  useEffect(() => {
    Promise.all([projectApi.getProjects(), userApi.getUsers(), departmentApi.getDepartments()])
      .then(([projectData, userData, departmentData]) => {
        setProjects(projectData);
        setUsers(userData);
        setDepartments(departmentData);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Title & Search / Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative min-w-[280px] w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilter('searchTerm', e.target.value)}
              placeholder="Tìm công việc/dự án/nhân sự (tên, mã, email)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-semibold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset
          </button>

          <button
            onClick={reloadCurrentPage}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại
          </button>
        </div>
      </div>

      {/* Multi-Criteria Filter Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Từ ngày (Hạn chót)</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilter('fromDate', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Đến ngày (Hạn chót)</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilter('toDate', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Dự án</label>
          <select
            value={filters.projectId}
            onChange={(e) => setFilter('projectId', e.target.value)}
            aria-label="Lọc theo dự án"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Nhân sự phụ trách</label>
          <select
            value={filters.assigneeId}
            onChange={(e) => setFilter('assigneeId', e.target.value)}
            aria-label="Lọc theo nhân sự phụ trách"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả nhân sự</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Bộ phận</label>
          <select
            value={filters.departmentId}
            onChange={(e) => setFilter('departmentId', e.target.value)}
            aria-label="Lọc theo bộ phận"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả bộ phận</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Lọc theo trạng thái công việc"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">Chưa bắt đầu</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Ưu tiên</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            aria-label="Lọc theo mức độ ưu tiên"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="HIGH">Cao</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">Loại công việc</label>
          <select
            value={filters.taskType}
            onChange={(e) => setFilter('taskType', e.target.value)}
            aria-label="Lọc theo loại công việc"
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả loại việc</option>
            <option value="PLANNING">Lập kế hoạch</option>
            <option value="DEVELOPMENT">Phát triển</option>
            <option value="DESIGN">Thiết kế</option>
            <option value="MARKETING">Marketing</option>
          </select>
        </div>

        {/* Toggle switch for Chỉ quá hạn */}
        <div className="flex flex-col justify-end">
          <label className="inline-flex items-center gap-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={filters.onlyOverdue}
              onChange={(e) => setFilter('onlyOverdue', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600 relative"></div>
            <span className="text-[11px] text-slate-600 font-medium">Chỉ quá hạn</span>
          </label>
        </div>
      </div>
    </div>
  );
};

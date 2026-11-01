import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderGit2,
  Users,
  Grid2X2,
  Bell,
  Calendar,
  BarChart3,
  Award,
  Mail,
  Building2,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface SidebarProps {
  onRefresh?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onRefresh }) => {
  const { dashboardMode, activeTab, setActiveTab, currentUser } = useAuthStore();
  const { isAdmin } = useAuthStore();

  const pmMenuItems = [
    { id: 'overview', label: 'Tổng quan', sub: 'KPI + biểu đồ + cảnh báo', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công việc', sub: 'Bảng công việc & cập nhật n...', icon: CheckSquare },
    { id: 'projects', label: 'Dự án', sub: 'Tiến độ dự án + click xem G...', icon: FolderGit2 },
    { id: 'members', label: 'Nhân sự', sub: 'Workload & quá hạn theo ng...', icon: Users },
    { id: 'departments', label: 'Phòng ban', sub: 'Cơ cấu và quản lý phòng ban', icon: Building2 },
    ...(isAdmin() ? [{ id: 'permissions', label: 'Phân quyền', sub: 'Cấp vai trò cho người dùng', icon: ShieldCheck }] : []),
    { id: 'eisenhower', label: 'Eisenhower', sub: 'Ma trận quan trọng/khẩn cấp', icon: Grid2X2 },
    { id: 'alerts', label: 'Cảnh báo', sub: 'Quá hạn / sắp đến hạn / log...', icon: Bell },
    { id: 'calendar', label: 'Lịch', sub: 'Lịch công việc dạng calendar', icon: Calendar },
    { id: 'gantt', label: 'Gantt', sub: 'Gantt chart theo dự án', icon: BarChart3 },
  ];

  const hrMenuItems = [
    { id: 'hr-overview', label: 'Tổng quan', sub: 'KPI deadline & điểm đánh giá', icon: LayoutDashboard },
    { id: 'hr-scorecard', label: 'Nhân sự', sub: 'Bảng điểm chi tiết từng người', icon: Users },
    { id: 'hr-tasks', label: 'Công việc', sub: 'Danh sách việc + vi phạm deadline', icon: CheckSquare },
    { id: 'hr-comparison', label: 'So sánh nhân sự', sub: 'Biểu đồ xếp hạng theo điểm', icon: Award },
  ];

  const emailMenuItems = [
    { id: 'email-settings', label: 'Cấu hình Email', sub: 'Tab quản lý gửi mail tự động', icon: Mail },
  ];

  const menuItems =
    dashboardMode === 'PM' ? pmMenuItems : dashboardMode === 'HR' ? hrMenuItems : emailMenuItems;

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-4 flex flex-col justify-between shadow-sm flex-shrink-0">
      <div>
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-2xl mb-4 border border-blue-100/50">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {dashboardMode === 'PM' ? 'PM' : dashboardMode === 'HR' ? 'HR' : 'SYS'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate">
              {dashboardMode === 'PM' ? 'PM Dashboard' : dashboardMode === 'HR' ? 'HR Dashboard' : 'Email Admin'}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">Timezone : Today</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition text-left ${
                  isActive
                    ? 'bg-blue-100/70 text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs leading-none truncate">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] truncate">
            {currentUser.name.split(' ')[currentUser.name.split(' ').length - 1]} ({currentUser.role})
          </span>
        </div>
        <button
          onClick={onRefresh}
          title="Tải lại dữ liệu"
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

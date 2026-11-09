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
  MessageCircle,
  Building2,
  ShieldCheck,
  RotateCw,
  WandSparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface SidebarProps {
  onRefresh?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onRefresh }) => {
  const { dashboardMode, activeTab, setActiveTab, currentUser } = useAuthStore();
  const { isAdmin } = useAuthStore();
  const employeeMenuItems = [
    { id: 'overview', label: 'Tổng quan', sub: 'Công việc và tiến độ của bạn', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công việc của tôi', sub: 'Cập nhật trạng thái và tiến độ', icon: CheckSquare },
    { id: 'messages', label: 'Nhắn tin', sub: 'Trò chuyện cùng đồng nghiệp', icon: MessageCircle },
  ];

  const pmMenuItems = [
    { id: 'overview', label: 'Tổng quan', sub: 'KPI + biểu đồ + cảnh báo', icon: LayoutDashboard },
    { id: 'projects', label: 'Dự án', sub: 'Tiến độ dự án + click xem G...', icon: FolderGit2 },
    { id: 'project-digitization', label: 'Số hóa dự án', sub: 'AI lập plan từ mô tả/tài liệu', icon: WandSparkles },
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
    { id: 'messages', label: 'Nhắn tin', sub: 'Trò chuyện cùng đồng nghiệp', icon: MessageCircle },
  ];

  const menuItems = currentUser.role === 'EMPLOYEE'
    ? employeeMenuItems
    : dashboardMode === 'PM' ? pmMenuItems : dashboardMode === 'HR' ? hrMenuItems : emailMenuItems;
  const workspaceLabel = currentUser.role === 'EMPLOYEE'
    ? 'Employee Workspace'
    : dashboardMode === 'PM' ? 'PM Dashboard' : dashboardMode === 'HR' ? 'HR Dashboard' : 'Messenger';

  return (
    <aside className="flex-shrink-0 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur md:p-3 lg:sticky lg:top-[88px] lg:h-[calc(100vh-112px)] lg:w-64 lg:p-4">
      <div>
        {/* Profile Card Header */}
        <div className="mb-3 hidden items-center gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm shadow-blue-200">
            {currentUser.role === 'EMPLOYEE' ? 'ME' : dashboardMode === 'PM' ? 'PM' : dashboardMode === 'HR' ? 'HR' : 'SYS'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="truncate text-xs font-bold text-slate-800">
              {workspaceLabel}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">Timezone : Today</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav aria-label="Điều hướng chính" className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={`${item.label}: ${item.sub}`}
                className={`group flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:w-full lg:min-w-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} aria-hidden="true" />
                <div className="hidden flex-1 min-w-0 lg:block">
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
      <div className="hidden items-center justify-between border-t border-slate-100 px-1 pt-4 text-xs text-slate-500 lg:flex">
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

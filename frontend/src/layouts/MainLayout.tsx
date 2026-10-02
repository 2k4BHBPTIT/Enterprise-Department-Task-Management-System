import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  LayoutDashboard,
  CheckSquare,
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  Briefcase,
  Columns,
  CalendarDays,
  Bell,
  BarChart,
  Settings,
  BookOpen,
  FolderOpen
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'TỔNG QUAN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Việc cần xử lý', path: '#', icon: <CheckSquare size={18} /> },
        { name: 'Quản lý dự án', path: '/projects', icon: <Briefcase size={18} /> },
      ]
    },
    {
      label: 'CÔNG VIỆC',
      items: [
        { name: 'Dự án', path: '#', icon: <Briefcase size={18} /> },
        { name: 'Tất cả công việc', path: '/tasks', icon: <CheckSquare size={18} /> },
        { name: 'Kanban', path: '#', icon: <Columns size={18} /> },
        { name: 'Lịch công việc', path: '#', icon: <CalendarDays size={18} /> },
        { name: 'Nhắc việc', path: '#', icon: <Bell size={18} /> },
        { name: 'Quản lý công việc', path: '/tasks/manage', icon: <CheckSquare size={18} /> },
      ]
    },
    {
      label: 'KPI',
      items: [
        { name: 'KPI Tháng', path: '#', icon: <BarChart size={18} /> },
        { name: 'Mẫu KPI', path: '#', icon: <BarChart size={18} /> },
        { name: 'Báo cáo KPI', path: '/kpi/report', icon: <BarChart size={18} /> },
      ]
    },
    {
      label: 'TỔ CHỨC',
      items: [
        ...(user?.role === 'ADMIN' || user?.role === 'MANAGER'
          ? [{ name: 'Nhân sự', path: '/departments', icon: <Building2 size={18} /> }]
          : []),
        ...(user?.role === 'ADMIN'
          ? [{ name: 'Danh mục (Users)', path: '/users', icon: <Users size={18} /> }]
          : []),
      ]
    },
    {
      label: 'DỮ LIỆU & HỆ THỐNG',
      items: [
        { name: 'Tài liệu', path: '#', icon: <FolderOpen size={18} /> },
        { name: 'Cài đặt', path: '#', icon: <Settings size={18} /> },
        { name: 'Cài đặt hệ thống', path: '/settings', icon: <Settings size={18} /> },
        { name: 'Hướng dẫn sử dụng', path: '#', icon: <BookOpen size={18} /> },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Dark Blue/Indigo Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#2b3674] text-white border-r border-[#3a4584] shadow-xl transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#3a4584]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <span className="block text-sm font-bold leading-tight">WEB APP</span>
              <span className="block text-[10px] text-indigo-200">QUẢN LÝ CÔNG VIỆC & KPI ĐỘI NHÓM</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={24} className="text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-[#3a4584] scrollbar-track-transparent">
          {navGroups.map((group, idx) => {
            if (group.items.length === 0) return null;
            return (
              <div key={idx}>
                <h3 className="px-3 text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname.startsWith('/tasks'));
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#4318FF] text-white shadow-md'
                            : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="mr-3 opacity-90">{item.icon}</span>
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b shadow-sm z-10">
          <div className="flex items-center">
            <button
              className="text-gray-500 lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
              {/* Dynamic Header Title based on route (Optional) */}
            </h2>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-gray-900">{user?.fullName || 'User'}</p>
              <p className="text-gray-500 text-xs">{user?.role || 'Role'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#4318FF] flex items-center justify-center text-white font-bold uppercase shadow-sm cursor-pointer hover:opacity-90">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f4f7fe]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

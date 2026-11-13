import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { Bell, ChevronDown, CheckCheck, Layers3, LogOut, ShieldCheck } from 'lucide-react';
import { taskApi } from '../../services/api/task.api';
import { Task } from '../../types';

interface HeaderProps {
  onLogout: () => void;
}

interface TaskNotification {
  id: string;
  task: Task;
  kind: 'overdue' | 'today' | 'soon';
  title: string;
  detail: string;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { dashboardMode, setDashboardMode, setActiveTab, currentUser } = useAuthStore();
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('readNotifications') || '[]') as string[]; }
    catch { return []; }
  });
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const modes = [
    { id: 'PM' as const, label: 'Dự án' },
    { id: 'HR' as const, label: 'Nhân sự' },
    { id: 'EMAIL' as const, label: 'Nhắn tin' },
  ];

  const notifications = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => task.status !== 'COMPLETED').flatMap((task): TaskNotification[] => {
      const deadline = new Date(`${String(task.deadline || task.dueDate).slice(0, 10)}T23:59:59`);
      const days = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
      if (!Number.isFinite(deadline.getTime())) return [];
      if (task.status === 'OVERDUE' || days < 0) return [{ id: `overdue-${task.id}`, task, kind: 'overdue' as const, title: task.title, detail: `Quá hạn ${Math.abs(days)} ngày` }];
      if (days === 0) return [{ id: `today-${task.id}`, task, kind: 'today' as const, title: task.title, detail: 'Hạn hoàn thành hôm nay' }];
      if (days <= 7) return [{ id: `soon-${task.id}`, task, kind: 'soon' as const, title: task.title, detail: `Còn ${days} ngày để hoàn thành` }];
      return [];
    });
  }, [tasks]);
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length;

  useEffect(() => {
    let active = true;
    const load = () => taskApi.getTasks(isEmployee ? { assigneeId: String(currentUser.id) } : undefined)
      .then((data) => active && setTasks(isEmployee
        ? data.filter((task) => String(task.assigneeId ?? task.assignee_id) === String(currentUser.id))
        : data))
      .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser.id, isEmployee]);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
      if (!profileRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  const markAllRead = () => {
    const ids = [...new Set([...readIds, ...notifications.map((notification) => notification.id)])];
    setReadIds(ids);
    localStorage.setItem('readNotifications', JSON.stringify(ids));
  };

  const openNotification = (id: string) => {
    const ids = [...new Set([...readIds, id])];
    setReadIds(ids);
    localStorage.setItem('readNotifications', JSON.stringify(ids));
    setNotificationsOpen(false);
    if (isEmployee) {
      setActiveTab('tasks');
    } else {
      setDashboardMode('PM');
      setActiveTab('alerts');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200">
          <Layers3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-slate-900">Enterprise Workspace</p>
          <p className="text-[11px] text-slate-400">{isEmployee ? 'Không gian làm việc cá nhân' : 'Quản trị công việc tập trung'}</p>
        </div>
      </div>

      {!isEmployee && <nav aria-label="Workspace" className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 md:flex">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setDashboardMode(mode.id)}
            aria-current={dashboardMode === mode.id ? 'page' : undefined}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              dashboardMode === mode.id
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </nav>}

      {!isEmployee && <label className="sr-only md:hidden" htmlFor="workspace-mode">Workspace</label>}
      {!isEmployee && <select
        id="workspace-mode"
        value={dashboardMode}
        onChange={(event) => setDashboardMode(event.target.value as typeof dashboardMode)}
        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 md:hidden focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
      </select>}

      <div ref={notificationRef} className="relative flex items-center gap-2">
        <button type="button" aria-label={`Thông báo, ${unreadCount} chưa đọc`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        {notificationsOpen && (
          <div role="dialog" aria-label="Thông báo công việc" className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div><p className="text-sm font-bold text-slate-800">Thông báo</p><p className="text-[11px] text-slate-400">{unreadCount} thông báo chưa đọc</p></div>
              {notifications.length > 0 && <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"><CheckCheck className="h-3.5 w-3.5" />Đánh dấu đã đọc</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-6 py-10 text-center"><Bell className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-600">Không có thông báo mới</p><p className="mt-1 text-[11px] text-slate-400">Công việc sắp tới hạn sẽ xuất hiện tại đây.</p></div>
              ) : notifications.map((notification) => (
                <button key={notification.id} type="button" onClick={() => openNotification(notification.id)} className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${readIds.includes(notification.id) ? '' : 'bg-blue-50/50'}`}>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.kind === 'overdue' ? 'bg-red-500' : notification.kind === 'today' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{notification.title}</p><p className="mt-1 text-[11px] text-slate-500">{notification.detail}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            aria-label="Mở menu tài khoản"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-left transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-28 truncate text-xs font-bold text-slate-800">{currentUser.name}</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400"><ShieldCheck className="h-3 w-3" aria-hidden="true" />{isEmployee ? 'Nhân viên' : currentUser.role}</span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" aria-hidden="true" />
          </button>
          {profileMenuOpen && (
            <div role="menu" aria-label="Menu tài khoản" className="absolute right-0 top-12 z-50 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};

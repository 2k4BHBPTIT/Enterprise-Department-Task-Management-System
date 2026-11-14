import React, { useEffect, useState } from 'react';
import { LoginView } from './features/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useAuthStore } from './store/auth.store';

// PM Views
import { PMOverview } from './features/dashboard/PMOverview';
import { EmployeeOverview } from './features/dashboard/EmployeeOverview';
import { TaskList } from './features/tasks/TaskList';
import { ProjectList } from './features/projects/ProjectList';
import { EmployeeProjects } from './features/projects/EmployeeProjects';
import { MembersWorkload } from './features/members/MembersWorkload';
import { ManagerTeam } from './features/members/ManagerTeam';
import { AlertsView } from './features/alerts/AlertsView';
import { CalendarView } from './features/calendar/CalendarView';
import { ProjectTimelineView } from './features/timeline/ProjectTimelineView';
import { EmployeeAttendance } from './features/hr/EmployeeAttendance';
import { PermissionManagement } from './features/permissions/PermissionManagement';

// HR Views
import { HROverview } from './features/hr/HROverview';
import { HRScorecard } from './features/hr/HRScorecard';
import { HRTaskList } from './features/hr/HRTaskList';
import { HRComparison } from './features/hr/HRComparison';
import { HRModulePlaceholder } from './features/hr/HRModulePlaceholder';

import { MessengerView } from './features/messages/MessengerView';
import { DepartmentManagement } from './features/departments/DepartmentManagement';
import { authApi } from './services/api/auth.api';
import { Role, User } from './types';

export const App: React.FC = () => {
  const { activeTab, setCurrentUser } = useAuthStore();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')));
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(localStorage.getItem('accessToken')));

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    authApi.getCurrentUser()
      .then((current) => {
        const user: User = {
          id: current.userId,
          full_name: current.fullName,
          name: current.fullName,
          email: current.email,
          department_id: current.departmentId ?? 0,
          departmentId: current.departmentId ?? 0,
          system_role: current.systemRole as Role,
          role: current.systemRole as Role,
          status: 'ACTIVE',
        };
        setCurrentUser(user);
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
      })
      .finally(() => setIsRestoringSession(false));
  }, [setCurrentUser]);

  if (isRestoringSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">Đang khôi phục phiên đăng nhập...</div>;
  }

  if (!isLoggedIn) return <LoginView onLoggedIn={() => setIsLoggedIn(true)} />;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header onLogout={handleLogout} />

      {/* Main Body with Sidebar + View Content */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:px-7 lg:py-5">
        {/* Sidebar */}
        <Sidebar onRefresh={handleRefresh} />

        {/* Content Pane */}
        <main id="main-content" className="min-w-0 flex-1 space-y-4">

          {isRefreshing ? (
            <div role="status" aria-live="polite" aria-busy="true" className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent motion-reduce:animate-none"></div>
                <span className="text-xs text-slate-500 font-semibold">Đang đồng bộ dữ liệu...</span>
              </div>
            </div>
          ) : (
            <div className="min-w-0 animate-fade-in motion-reduce:animate-none">
              {currentUser.role === 'EMPLOYEE' ? (
                activeTab === 'messages' ? <MessengerView />
                  : activeTab === 'tasks' ? <TaskList />
                    : activeTab === 'employee-projects' ? <EmployeeProjects />
                      : activeTab === 'calendar' ? <CalendarView assigneeId={String(currentUser.id)} />
                        : activeTab === 'employee-attendance' ? <EmployeeAttendance />
                          : <EmployeeOverview />
              ) : (
                <>
                  {activeTab === 'overview' && <PMOverview />}
                  {activeTab === 'tasks' && <TaskList />}
                  {activeTab === 'projects' && <ProjectList />}
                  {activeTab === 'members' && <MembersWorkload />}
                  {activeTab === 'manager-team' && currentUser.role === 'MANAGER' && <ManagerTeam />}
                  {activeTab === 'departments' && <DepartmentManagement />}
                  {activeTab === 'permissions' && <PermissionManagement />}
                  {activeTab === 'alerts' && <AlertsView />}
                  {activeTab === 'timeline' && <ProjectTimelineView managerId={currentUser.role === 'MANAGER' ? String(currentUser.id) : undefined} />}
                  {activeTab === 'calendar' && <CalendarView managerId={currentUser.role === 'MANAGER' ? String(currentUser.id) : undefined} />}
                  {activeTab === 'hr-overview' && <HROverview />}
                  {activeTab === 'hr-attendance' && <HRModulePlaceholder module="attendance" />}
                  {activeTab === 'hr-payroll' && <HRModulePlaceholder module="payroll" />}
                  {activeTab === 'hr-scorecard' && <HRScorecard />}
                  {activeTab === 'hr-tasks' && <HRTaskList />}
                  {activeTab === 'hr-comparison' && <HRComparison />}
                  {activeTab === 'messages' && <MessengerView />}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

import { create } from 'zustand';
import { Role, User } from '../types';

const guestUser: User = {
  id: 0,
  full_name: 'Khách',
  name: 'Khách',
  email: '',
  department_id: 0,
  departmentId: 0,
  system_role: 'EMPLOYEE',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
};

interface AuthState {
  currentUser: User;
  dashboardMode: 'PM' | 'HR' | 'EMAIL';
  activeTab: string;
  setCurrentUser: (user: User) => void;
  setRole: (role: Role) => void;
  setDashboardMode: (mode: 'PM' | 'HR' | 'EMAIL') => void;
  setActiveTab: (tab: string) => void;
  isAdmin: () => boolean;
  canManageProject: () => boolean;
  canCreateProject: () => boolean;
  canEditProject: () => boolean;
  canDeleteProject: () => boolean;
  canCreateTask: () => boolean;
  canEditTask: () => boolean;
  canDeleteTask: () => boolean;
  canReassignLeader: () => boolean;
  canManageStaff: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: guestUser,
  dashboardMode: 'PM',
  activeTab: 'overview',

  setCurrentUser: (user: User) => set({ currentUser: user }),

  setRole: (role: Role) => {
    const user = get().currentUser;
    set({ currentUser: { ...user, role } });
  },

  setDashboardMode: (mode: 'PM' | 'HR' | 'EMAIL') => {
    const defaultTab = mode === 'PM' ? 'overview' : mode === 'HR' ? 'hr-overview' : 'messages';
    set({ dashboardMode: mode, activeTab: defaultTab });
  },

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  // Role-based security checks
  isAdmin: () => get().currentUser.role === 'ADMIN',

  canManageProject: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'PROJECT_LEADER'].includes(role);
  },

  canCreateProject: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'].includes(role);
  },

  canEditProject: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'].includes(role);
  },

  canDeleteProject: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER'].includes(role);
  },

  canCreateTask: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'PROJECT_LEADER'].includes(role);
  },

  canEditTask: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'PROJECT_LEADER'].includes(role);
  },

  canDeleteTask: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'].includes(role);
  },

  canReassignLeader: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER', 'PROJECT_MANAGER'].includes(role);
  },

  canManageStaff: () => {
    const role = get().currentUser.role;
    return ['ADMIN', 'MANAGER'].includes(role);
  },
}));

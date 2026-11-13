export type Role = 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'EMPLOYEE' 
  | 'PROJECT_LEADER' 
  | 'PROJECT_MANAGER' 
  | 'PROJECT_MEMBER';

// ==========================================
// 1. USERS TABLE (Khớp USERS trong DB)
// ==========================================
export interface User {
  id: number | string;
  full_name: string;
  name: string; // Alias tương thích frontend
  email: string;
  department_id: number | string;
  departmentId: number | string; // Alias
  department_name?: string;
  departmentName?: string;
  system_role: Role;
  role: Role; // Alias
  status: 'ACTIVE' | 'INACTIVE' | string;
  avatar_url?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  skills?: string[];
  education?: string;
  experience_years?: number;
  seniority?: string;
  salary?: number;
  cv_file_name?: string;
}

// ==========================================
// 2. DEPARTMENTS TABLE (Khớp DEPARTMENTS trong DB)
// ==========================================
export interface Department {
  id: number | string;
  name: string;
  description?: string;
  manager_id?: number | string;
  managerName?: string;
  memberCount?: number;
  code?: string;
}

// ==========================================
// 3. PROJECTS TABLE (Khớp PROJECTS trong DB)
// ==========================================
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'OVERDUE';

export interface Project {
  id: number | string;
  name: string;
  description: string;
  department_id: number | string;
  departmentId: number | string; // Alias
  leader_id: number | string;
  pmId: number | string; // Alias
  leader_name?: string;
  pmName?: string; // Alias
  created_by?: number | string;
  start_date: string;
  startDate: string; // Alias
  end_date: string;
  endDate: string; // Alias
  progress_percent: number;
  progressPercent: number; // Alias
  status: ProjectStatus;
  has_overdue_tasks?: boolean;
  hasOverdueTasks?: boolean; // Alias
  total_tasks?: number;
  totalTasks?: number; // Alias
  completed_tasks?: number;
  completedTasks?: number; // Alias
}

// ==========================================
// 4. TASKS TABLE (Khớp TASKS trong DB)
// ==========================================
export type TaskStatus = 
  | 'TODO'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'PLANNING' | 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'TESTING' | 'OTHER';
export interface Task {
  id: number | string;
  project_id: number | string;
  projectId: number | string; // Alias
  project_name?: string;
  projectName?: string; // Alias
  department_id?: number | string;
  departmentId?: number | string; // Alias
  department_name?: string;
  departmentName?: string; // Alias
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  task_type: TaskType;
  taskType: TaskType; // Alias
  is_important: boolean;
  isImportant: boolean; // Alias
  is_urgent: boolean;
  isUrgent: boolean; // Alias
  progress_percent: number;
  progressPercent: number; // Alias
  assignee_id: number | string;
  assigneeId: number | string; // Alias
  assignee_name?: string;
  assigneeName?: string; // Alias
  follower_ids?: (number | string)[];
  followerIds?: string[]; // Alias
  dependencyIds?: string[];
  created_by?: number | string;
  start_date?: string;
  startDate?: string; // Alias
  deadline: string;
  dueDate: string; // Alias
  completed_at?: string;
  completedDate?: string; // Alias
  weight_score?: number;
  weightScore?: number; // Alias
  rework_count?: number;
  reworkCount?: number; // Alias
  overdue_days?: number;
  overdueDays?: number; // Alias
  notes?: string;
}

// ==========================================
// 5. EMAIL CONFIGS TABLE (Khớp EMAIL_CONFIGS)
// ==========================================
export interface EmailNotificationConfig {
  id?: number | string;
  is_enabled: boolean;
  isEnabled: boolean; // Alias
  daily_send_time: string;
  dailySendTime: string; // Alias
  remind_before_7_days: boolean;
  remindBefore7Days: boolean; // Alias
  remind_before_3_days: boolean;
  remindBefore3Days: boolean; // Alias
  remind_before_1_day: boolean;
  remindBefore1Day: boolean; // Alias
  remind_on_due_date: boolean;
  remindOnDueDate: boolean; // Alias
  recipient_emails: string;
  recipientEmails: string; // Alias
}

// ==========================================
// 6. HR & FILTER MODELS
// ==========================================
export interface HRScorecardRecord {
  userId: number | string;
  userName: string;
  userEmail: string;
  departmentName: string;
  roleName: string;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  onTimeRate: number;
  overdueTasks: number;
  avgOverdueDays: number;
  avgWeightScore: number;
  overallScore: number;
  rankTier: string;
}

export interface GlobalFilterParams {
  searchTerm: string;
  fromDate: string;
  toDate: string;
  projectId: string;
  assigneeId: string;
  departmentId: string;
  status: string;
  priority: string;
  taskType: string;
  onlyOverdue: boolean;
}

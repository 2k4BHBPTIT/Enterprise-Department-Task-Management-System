import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { taskApi } from '../../services/api/task.api';
import { projectApi } from '../../services/api/project.api';
import { Task, Project } from '../../types';

export const PMOverview: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskApi.getTasks(), projectApi.getProjects()])
      .then(([taskData, projectData]) => {
        setTasks(taskData);
        setProjects(projectData);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan'))
      .finally(() => setIsLoading(false));
  }, []);

  const count = (status: string) => tasks.filter((task) => task.status === status).length;
  const overdue = tasks.filter((task) => task.status === 'OVERDUE' || (task.overdueDays || 0) > 0).length;
  const completedPercent = tasks.length ? Math.round(count('COMPLETED') / tasks.length * 100) : 0;
  const cards = [
    ['Tổng công việc', tasks.length, 'blue'],
    ['Đang làm', count('IN_PROGRESS'), 'blue'],
    ['Hoàn thành', count('COMPLETED'), 'emerald'],
    ['Đang chờ', count('WAITING'), 'sky'],
    ['Bị chặn', count('BLOCKED'), 'amber'],
    ['Quá hạn', overdue, 'rose'],
  ] as const;

  const statusData = [
    { name: 'Chưa làm', value: count('TODO'), color: '#94A3B8' },
    { name: 'Đang làm', value: count('IN_PROGRESS'), color: '#3B82F6' },
    { name: 'Đang chờ', value: count('WAITING'), color: '#38BDF8' },
    { name: 'Bị chặn', value: count('BLOCKED'), color: '#F59E0B' },
    { name: 'Hoàn thành', value: count('COMPLETED'), color: '#10B981' },
    { name: 'Quá hạn', value: overdue, color: '#F43F5E' },
    { name: 'Đã hủy', value: count('CANCELLED'), color: '#CBD5E1' },
  ].filter((item) => item.value > 0);

  const priorityData = [
    { name: 'Thấp', value: tasks.filter((task) => task.priority === 'LOW').length, color: '#94A3B8' },
    { name: 'Trung bình', value: tasks.filter((task) => task.priority === 'MEDIUM').length, color: '#38BDF8' },
    { name: 'Cao', value: tasks.filter((task) => task.priority === 'HIGH').length, color: '#F59E0B' },
    { name: 'Khẩn cấp', value: tasks.filter((task) => task.priority === 'URGENT').length, color: '#F43F5E' },
  ];

  const projectData = projects.slice(0, 10).map((project) => ({
    name: project.name.length > 18 ? `${project.name.slice(0, 18)}...` : project.name,
    progress: project.progressPercent ?? project.progress_percent ?? 0,
  }));

  const workloadData = Array.from(tasks.reduce((result, task) => {
    const name = task.assigneeName || task.assignee_name || 'Chưa phân công';
    const current = result.get(name) || { total: 0, completed: 0 };
    current.total += 1;
    if (task.status === 'COMPLETED') current.completed += 1;
    result.set(name, current);
    return result;
  }, new Map<string, { total: number; completed: number }>()).entries())
    .map(([name, value]) => ({
      name: name.length > 16 ? `${name.slice(0, 16)}...` : name,
      total: value.total,
      completed: value.completed,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (error) return <div className="bg-white rounded-3xl p-5 text-red-600">{error}</div>;
  if (isLoading) return <div className="bg-white rounded-3xl p-10 text-center text-sm text-slate-500">Đang tải dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(([label, value, color]) => (
          <div key={label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">{label}</span>
            <div className={`text-2xl font-bold mt-2 text-${color}-600`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between"><h3 className="text-sm font-bold">Tỷ lệ hoàn thành</h3><span>{completedPercent}%</span></div>
          <div className="h-3 bg-slate-100 rounded-full mt-4 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${completedPercent}%` }} /></div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold mb-3">Dự án đang theo dõi</h3>
          <div className="space-y-2">{projects.slice(0, 8).map((project) => (
            <div key={project.id} className="flex justify-between text-xs border-b pb-2"><span>{project.name}</span><strong>{project.progressPercent ?? project.progress_percent ?? 0}%</strong></div>
          ))}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Phân bổ trạng thái công việc</h3>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={105} paddingAngle={2}>
                  {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Công việc theo mức ưu tiên</h3>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Số công việc" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Tiến độ theo dự án</h3>
          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 25, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Tiến độ']} />
                <Bar dataKey="progress" name="Tiến độ" fill="#3B82F6" radius={[0, 7, 7, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Khối lượng công việc theo nhân sự</h3>
          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Tổng việc" fill="#60A5FA" radius={[5, 5, 0, 0]} />
                <Bar dataKey="completed" name="Đã hoàn thành" fill="#34D399" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

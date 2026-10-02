import React, { useEffect, useState } from 'react';
import { Users, Briefcase, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';

interface DashboardSummary {
  totalEmployees: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskStatusCounts: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setSummary(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="text-red-500">Failed to load dashboard data.</div>;
  }

  const kpis = [
    { title: 'Total Employees', value: summary.totalEmployees, icon: <Users size={24} />, color: 'bg-blue-500' },
    { title: 'Active Projects', value: summary.activeProjects, icon: <Briefcase size={24} />, color: 'bg-indigo-500' },
    { title: 'Completed Tasks', value: summary.completedTasks, icon: <CheckCircle size={24} />, color: 'bg-green-500' },
    { title: 'Overdue Tasks', value: summary.overdueTasks, icon: <Clock size={24} />, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
            <div className={`p-4 rounded-lg text-white ${kpi.color} mr-4`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h2>
          <div className="space-y-4">
            {Object.entries(summary.taskStatusCounts).length === 0 ? (
              <p className="text-gray-500">No tasks available.</p>
            ) : (
              Object.entries(summary.taskStatusCounts).map(([status, count]) => {
                const percentage = summary.totalTasks > 0 ? Math.round((count / summary.totalTasks) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{status.replace('_', ' ')}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

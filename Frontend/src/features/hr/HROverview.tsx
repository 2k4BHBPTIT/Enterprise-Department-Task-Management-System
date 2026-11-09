import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';
import { useGetHRScorecards, useGetHRViolations } from '../../hooks/useHR';

export const HROverview: React.FC = () => {
  const { scorecards, isLoading: scorecardsLoading } = useGetHRScorecards();
  const { violations, isLoading: violationsLoading } = useGetHRViolations();
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const setFilters = useFilterStore((state) => state.setFilters);

  const openTasks = (filters: { status?: 'COMPLETED' | 'OVERDUE'; onlyOverdue?: boolean; searchTerm?: string }) => {
    setFilters({
      status: filters.status || 'ALL',
      onlyOverdue: filters.onlyOverdue || false,
      searchTerm: filters.searchTerm || '',
      priority: 'ALL',
      projectId: 'ALL',
      assigneeId: 'ALL',
    });
    setActiveTab('tasks');
  };

  const openStaff = (searchTerm = '') => {
    setFilters({ searchTerm });
    setActiveTab(searchTerm ? 'members' : 'hr-scorecard');
  };
  const donutData = [
    { name: 'Đúng hạn', type: 'ON_TIME', value: scorecards.reduce((sum, item) => sum + item.onTimeTasks, 0), color: '#10B981' },
    { name: 'Trễ deadline', type: 'OVERDUE', value: violations.length, color: '#EF4444' },
  ];

  const scoreData = scorecards
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10)
    .map((item) => ({ name: item.userName, score: item.overallScore, userId: item.userId }));

  const deptMap = scorecards.reduce((result, item) => {
    const current = result.get(item.departmentName || '-') || { onTime: 0, overdue: 0 };
    current.onTime += item.onTimeTasks;
    current.overdue += item.overdueTasks;
    result.set(item.departmentName || '-', current);
    return result;
  }, new Map<string, { onTime: number; overdue: number }>());
  const deptData = Array.from(deptMap.entries()).map(([name, values]) => ({ name, ...values }));

  const totalTasks = scorecards.reduce((sum, item) => sum + item.totalTasks, 0);
  const completedTasks = scorecards.reduce((sum, item) => sum + item.completedTasks, 0);
  const onTimeTasks = scorecards.reduce((sum, item) => sum + item.onTimeTasks, 0);
  const overdueTasks = scorecards.reduce((sum, item) => sum + item.overdueTasks, 0);
  const averageScore = scorecards.length ? scorecards.reduce((sum, item) => sum + item.overallScore, 0) / scorecards.length : 0;
  const avgOverdueDays = violations.length
    ? violations.reduce((sum, task) => sum + (task.overdueDays || 0), 0) / violations.length
    : 0;
  const worstEmployee = scorecards.slice().sort((a, b) => b.overdueTasks - a.overdueTasks)[0];
  const completedPercent = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;
  const onTimePercent = completedTasks ? Math.round(onTimeTasks / completedTasks * 100) : 0;

  if (scorecardsLoading || violationsLoading) {
    return <div role="status" className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">Đang tải dữ liệu nhân sự...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button type="button" onClick={() => openStaff()} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng nhân sự</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{totalTasks} công việc</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{scorecards.length}</div>
        </button>

        <button type="button" onClick={() => openTasks({ status: 'COMPLETED' })} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Công việc hoàn thành</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">{completedPercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{completedTasks}</div>
        </button>

        <button type="button" onClick={() => openTasks({ status: 'COMPLETED' })} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Đúng hạn</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">{onTimePercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{onTimeTasks}</div>
        </button>

        <button type="button" onClick={() => setActiveTab('hr-tasks')} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Trễ deadline</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold">Trễ TB {avgOverdueDays.toFixed(1)} ngày</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{overdueTasks}</div>
        </button>

        <button type="button" onClick={() => openStaff()} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Điểm trung bình</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{scorecards.length} nhân sự</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{averageScore.toFixed(1)}</div>
        </button>

        <button type="button" onClick={() => { if (worstEmployee) setFilters({ searchTerm: worstEmployee.userName }); setActiveTab('hr-tasks'); }} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Nhân sự trễ nhiều</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">{worstEmployee?.userName || '-'}</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{worstEmployee?.overdueTasks || 0}</div>
        </button>
      </div>

      {/* 3 Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart: On-time vs Overdue */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Đúng hạn vs Trễ deadline</h3>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">{onTimeTasks} đúng hạn • {overdueTasks} trễ</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(entry: { type?: string }) => entry.type === 'OVERDUE' ? setActiveTab('hr-tasks') : openTasks({ status: 'COMPLETED' })}
                  className="cursor-pointer outline-none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đúng hạn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Trễ deadline
            </span>
          </div>
        </div>

        {/* Bar Chart: Scores */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Điểm trung bình theo nhân sự</h3>
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{scorecards.length} nhân sự</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#60A5FA" radius={[4, 4, 0, 0]} onClick={(entry: { name?: string }) => entry.name && openStaff(entry.name)} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar Chart: Department Violations */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Vi phạm deadline theo phòng ban</h3>
            <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-medium">{overdueTasks} việc trễ</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="onTime" stackId="a" fill="#93C5FD" onClick={() => openStaff()} />
                <Bar dataKey="overdue" stackId="a" fill="#F87171" radius={[4, 4, 0, 0]} onClick={() => setActiveTab('hr-tasks')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

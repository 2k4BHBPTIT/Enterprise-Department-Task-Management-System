import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const HROverview: React.FC = () => {
  const donutData = [
    { name: 'Đúng hạn', value: 26, color: '#10B981' },
    { name: 'Trễ deadline', value: 4, color: '#EF4444' },
  ];

  const scoreData = [
    { name: 'Võ Thanh Tâm', score: 100 },
    { name: 'Hoàng Yến Nhi', score: 100 },
    { name: 'Đỗ Quang Vinh', score: 100 },
    { name: 'Phạm Gia Bảo', score: 100 },
    { name: 'Đặng Hoài Nam', score: 100 },
    { name: 'Ngô Bích Ngọc', score: 100 },
    { name: 'Bùi Đức Long', score: 100 },
    { name: 'Trần Quốc Huy', score: 82.5 },
  ];

  const deptData = [
    { name: 'Quản lý DA', onTime: 3, overdue: 2 },
    { name: 'Kỹ thuật', onTime: 7, overdue: 1 },
    { name: 'Thiết kế', onTime: 2, overdue: 1 },
    { name: 'Kinh doanh', onTime: 3, overdue: 0 },
    { name: 'Nhân sự', onTime: 4, overdue: 0 },
    { name: 'Tài chính', onTime: 3, overdue: 0 },
    { name: 'Marketing', onTime: 2, overdue: 0 },
    { name: 'Sản phẩm', onTime: 2, overdue: 0 },
  ];

  return (
    <div className="space-y-4">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng nhân sự</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">30 công việc</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">10</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Công việc hoàn thành</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">100%</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">30</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Đúng hạn</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">87%</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">26</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Trễ deadline</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold">Trễ TB 1.3 ngày</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">4</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Điểm trung bình</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">TB 90.2%</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">93,3</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Nhân sự trễ nhiều</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Nguyễn Minh Anh</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">2</div>
        </div>
      </div>

      {/* 3 Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart: On-time vs Overdue */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Đúng hạn vs Trễ deadline</h3>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">26 đúng hạn • 4 trễ</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
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
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">10 nhân sự</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar Chart: Department Violations */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Vi phạm deadline theo phòng ban</h3>
            <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-medium">4 việc trễ</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="onTime" stackId="a" fill="#93C5FD" />
                <Bar dataKey="overdue" stackId="a" fill="#F87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

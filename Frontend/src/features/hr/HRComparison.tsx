import React from 'react';
import { useGetHRScorecards } from '../../hooks/useHR';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SkeletonTable } from '../../components/common/SkeletonTable';

export const HRComparison: React.FC = () => {
  const { scorecards, isLoading } = useGetHRScorecards();

  const chartData = scorecards.slice(0, 10).map((u) => ({
    name: u.userName,
    score: u.overallScore,
    onTimeRate: u.onTimeRate,
  }));

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800">So sánh nhân sự theo điểm & đúng hạn</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Biểu đồ thanh thể hiện điểm đánh giá, click vào tên nhân sự trong bảng để xem chi tiết.
        </p>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Horizontal Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">Xếp hạng điểm (Top 15)</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Điểm
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Đúng hạn %
                </span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#93C5FD" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="onTimeRate" fill="#F472B6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Ranking List (1 col) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800">Bảng xếp hạng nhanh</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {scorecards.map((item, idx) => (
                <div key={item.userId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-800">{item.userName}</div>
                      <div className="text-[10px] text-slate-400">{item.departmentName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700">{item.overallScore}</div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {item.rankTier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

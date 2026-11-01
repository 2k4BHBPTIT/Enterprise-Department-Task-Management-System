import React from 'react';
import { useGetHRScorecards } from '../../hooks/useHR';
import { SkeletonTable } from '../../components/common/SkeletonTable';

export const HRScorecard: React.FC = () => {
  const { scorecards, isLoading } = useGetHRScorecards();

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Bảng điểm nhân sự</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mỗi dòng là một nhân sự với điểm đánh giá, tỷ lệ đúng hạn, trung bình độ trễ, trọng số & số lần bị trả về.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-xl">
          {scorecards.length} nhân sự
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={9} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-semibold">Nhân sự</th>
                <th className="pb-3 font-semibold">Bộ phận</th>
                <th className="pb-3 font-semibold">Vai trò</th>
                <th className="pb-3 font-semibold text-center">Tổng việc</th>
                <th className="pb-3 font-semibold text-center">Hoàn thành</th>
                <th className="pb-3 font-semibold text-center">Đúng hạn</th>
                <th className="pb-3 font-semibold text-center">Trễ deadline</th>
                <th className="pb-3 font-semibold text-center">Trễ TB (ngày)</th>
                <th className="pb-3 font-semibold text-center">Trọng số TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scorecards.map((item) => (
                <tr key={item.userId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 pr-3">
                    <div className="font-bold text-slate-800">{item.userName}</div>
                    <div className="text-[11px] text-slate-400">{item.userEmail}</div>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600 font-medium">{item.departmentName}</td>
                  <td className="py-3.5 pr-3 text-slate-500">{item.roleName}</td>
                  <td className="py-3.5 text-center font-semibold text-slate-700">{item.totalTasks}</td>
                  <td className="py-3.5 text-center font-semibold text-slate-700">{item.completedTasks}</td>
                  <td className="py-3.5 text-center font-semibold text-emerald-600">
                    {item.onTimeTasks} ({item.onTimeRate}%)
                  </td>
                  <td className="py-3.5 text-center font-semibold text-rose-500">{item.overdueTasks}</td>
                  <td className="py-3.5 text-center text-slate-600">{item.avgOverdueDays}</td>
                  <td className="py-3.5 text-center text-slate-600">{item.avgWeightScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

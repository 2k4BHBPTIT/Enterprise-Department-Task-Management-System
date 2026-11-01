import React from 'react';
import { useGetHRViolations } from '../../hooks/useHR';
import { SkeletonTable } from '../../components/common/SkeletonTable';

export const HRTaskList: React.FC = () => {
  const { violations, isLoading } = useGetHRViolations();

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Danh sách công việc vi phạm deadline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Thể hiện hạn chót, ngày hoàn thành thực tế, số ngày trễ kỷ luật cho từng công việc.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-600 rounded-xl">
          {violations.length} công việc vi phạm
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} cols={7} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-semibold">Công việc</th>
                <th className="pb-3 font-semibold">Nhân sự</th>
                <th className="pb-3 font-semibold">Bộ phận</th>
                <th className="pb-3 font-semibold">Dự án</th>
                <th className="pb-3 font-semibold">Hạn chót</th>
                <th className="pb-3 font-semibold">Hoàn thành</th>
                <th className="pb-3 font-semibold text-center">Trễ (ngày)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {violations.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 pr-3">
                    <div className="font-bold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-400">{t.description}</div>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-700">{t.assigneeName}</td>
                  <td className="py-3.5 pr-3 text-slate-500">{t.departmentName}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{t.projectName}</td>
                  <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap">{t.dueDate}</td>
                  <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap">{t.completedDate || '-'}</td>
                  <td className="py-3.5 text-center">
                    {(t.overdueDays ?? 0) > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
                        Trễ {t.overdueDays} ngày
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                        Đúng hạn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { CalendarCheck2, Wallet } from 'lucide-react';

interface HRModulePlaceholderProps {
  module: 'attendance' | 'payroll';
}

export const HRModulePlaceholder: React.FC<HRModulePlaceholderProps> = ({ module }) => {
  const isAttendance = module === 'attendance';
  const Icon = isAttendance ? CalendarCheck2 : Wallet;
  const title = isAttendance ? 'Chấm công' : 'Lương Công';
  const description = isAttendance
    ? 'Chưa có API chấm công và đơn nghỉ phép trong backend. Khi API sẵn sàng, dữ liệu check-in và phê duyệt sẽ hiển thị tại đây.'
    : 'Chưa có API bảng lương trong backend. Màn hình sẽ hiển thị dữ liệu lương và phúc lợi khi backend cung cấp API tương ứng.';

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
          Đang chờ tích hợp API backend
        </span>
      </div>
    </section>
  );
};

import React from 'react';
import { AlertCircle, CalendarCheck2, Clock3, FileText } from 'lucide-react';

export const EmployeeAttendance: React.FC = () => (
  <div className="space-y-4">
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarCheck2 className="h-5 w-5" /></div>
        <div><h2 className="text-sm font-bold text-slate-800">Chấm công / Đơn từ</h2><p className="mt-1 text-xs text-slate-400">Theo dõi giờ làm và gửi yêu cầu cá nhân.</p></div>
      </div>
    </section>

    <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div><p className="text-xs font-bold">Chức năng đang chờ API từ backend</p><p className="mt-1 text-[11px] leading-5 text-amber-800">Hiện chưa có API check-in/check-out, lịch sử chấm công hoặc gửi đơn. Các thao tác được khóa để tránh hiển thị dữ liệu giả hoặc báo gửi thành công khi chưa lưu được.</p></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-slate-800">Chấm công hôm nay</h3></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] text-slate-400">Giờ vào</span><strong className="mt-2 block text-lg text-slate-500">Chưa có dữ liệu</strong></div>
          <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] text-slate-400">Giờ ra</span><strong className="mt-2 block text-lg text-slate-500">Chưa có dữ liệu</strong></div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled className="flex-1 cursor-not-allowed rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white opacity-50">Check-in</button>
          <button type="button" disabled className="flex-1 cursor-not-allowed rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500 opacity-60">Check-out</button>
        </div>
        <p className="mt-3 text-[10px] text-slate-400">Lịch sử chấm công sẽ hiển thị tại đây sau khi API được tích hợp.</p>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-slate-800">Gửi đơn / yêu cầu</h3></div>
        <div className="mt-4 space-y-3">
          <label className="block text-[11px] font-semibold text-slate-500">Loại yêu cầu<select disabled className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400"><option>Chờ API hỗ trợ</option></select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px] font-semibold text-slate-500">Từ ngày<input disabled type="date" className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400" /></label>
            <label className="block text-[11px] font-semibold text-slate-500">Đến ngày<input disabled type="date" className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400" /></label>
          </div>
          <label className="block text-[11px] font-semibold text-slate-500">Lý do<textarea disabled rows={3} placeholder="Biểu mẫu sẽ khả dụng khi backend cung cấp API." className="mt-1.5 w-full cursor-not-allowed resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400 placeholder:text-slate-400" /></label>
          <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500">Gửi yêu cầu</button>
        </div>
      </section>
    </div>
  </div>
);

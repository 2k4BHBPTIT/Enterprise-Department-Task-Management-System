import React, { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CalendarCheck2, ClipboardList, Users, UserRoundCheck, UserRoundX, CalendarOff } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { Department, User } from '../../types';

const chartColors = ['#2452e6', '#6284ed', '#90a9f2', '#b5c6f7', '#d2ddfa'];

export const HROverview: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);

  useEffect(() => {
    let active = true;
    Promise.all([userApi.getUsers(), departmentApi.getDepartments()])
      .then(([userData, departmentData]) => {
        if (!active) return;
        setUsers(userData.filter((user) => user.status === 'ACTIVE'));
        setDepartments(departmentData);
        setError('');
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu nhân sự.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const departmentData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const department of departments) counts.set(String(department.id), 0);
    for (const user of users) {
      const id = String(user.departmentId ?? user.department_id);
      if (counts.has(id)) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return departments.map((department) => ({
      name: department.name,
      value: counts.get(String(department.id)) || 0,
    })).filter((department) => department.value > 0);
  }, [departments, users]);

  const stats = [
    { title: 'Tổng nhân sự', value: isLoading ? '—' : users.length, note: 'Tài khoản đang hoạt động', icon: Users, tone: 'blue', onClick: () => setActiveTab('hr-members') },
    { title: 'Có mặt hôm nay', value: '—', note: 'Chưa có dữ liệu chấm công', icon: UserRoundCheck, tone: 'emerald', onClick: () => setActiveTab('hr-attendance') },
    { title: 'Đi muộn / Vắng', value: '—', note: 'Chưa có dữ liệu chấm công', icon: UserRoundX, tone: 'amber', onClick: () => setActiveTab('hr-attendance') },
    { title: 'Tạm nghỉ / Phép', value: '—', note: 'Chưa có API đơn nghỉ phép', icon: CalendarOff, tone: 'sky', onClick: () => setActiveTab('hr-attendance') },
    { title: 'Đơn chờ duyệt', value: '—', note: 'Chưa có API đơn từ', icon: ClipboardList, tone: 'violet', onClick: () => setActiveTab('hr-attendance') },
  ] as const;

  if (isLoading) {
    return <div role="status" className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">Đang tải dữ liệu tổng quan...</div>;
  }

  if (error) {
    return <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Tổng quan nhân sự</h1>
          <p className="mt-1 text-xs text-slate-400">Tình hình nhân sự và hoạt động trong doanh nghiệp</p>
        </div>
        <span className="text-xs text-slate-400">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date())}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const toneClasses = {
            blue: 'bg-blue-50 text-blue-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
            sky: 'bg-sky-50 text-sky-600',
            violet: 'bg-violet-50 text-violet-600',
          };
          return (
            <button key={stat.title} type="button" onClick={stat.onClick} className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md motion-reduce:transform-none">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">{stat.title}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</div>
              <p className={`mt-1 text-[10px] ${stat.value === '—' ? 'text-slate-400' : 'font-semibold text-emerald-600'}`}>{stat.note}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold text-slate-800">Biểu đồ chuyên cần</h2><p className="mt-1 text-[11px] text-slate-400">Dữ liệu đi làm, đi muộn và vắng theo ngày</p></div>
            <button type="button" onClick={() => setActiveTab('hr-attendance')} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Hôm nay</button>
          </div>
          <div className="mt-4 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center">
            <div><CalendarCheck2 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">Chưa có dữ liệu chấm công</p><p className="mt-1 max-w-md text-[11px] leading-5 text-slate-400">Backend hiện chưa cung cấp API check-in, đi muộn hoặc vắng mặt để dựng biểu đồ.</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div><h2 className="text-sm font-bold text-slate-800">Tỉ lệ nhân sự các phòng ban</h2><p className="mt-1 text-[11px] text-slate-400">Phân bổ theo số nhân sự đang hoạt động</p></div>
          {departmentData.length ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={departmentData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>
                      {departmentData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} nhân sự`, 'Số lượng']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {departmentData.map((item, index) => (
                  <span key={item.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-xs text-slate-400">Chưa có dữ liệu nhân sự theo phòng ban.</div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[
          { title: 'Nhật kí điểm danh hôm nay', detail: 'Lịch sử check-in, thời gian và trạng thái của nhân viên.', icon: CalendarCheck2 },
          { title: 'Đơn chờ duyệt', detail: 'Đơn nghỉ phép và yêu cầu nhân sự cần xử lý.', icon: ClipboardList },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div><h2 className="text-sm font-bold text-slate-800">{item.title}</h2><p className="mt-1 text-[11px] text-slate-400">{item.detail}</p></div>
                <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <button type="button" onClick={() => setActiveTab('hr-attendance')} className="mt-4 flex min-h-24 w-full flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 text-center hover:bg-slate-100">
                <p className="text-xs font-semibold text-slate-500">Chưa có dữ liệu</p>
                <p className="mt-1 text-[10px] text-slate-400">Backend chưa cung cấp API cho mục này.</p>
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
};

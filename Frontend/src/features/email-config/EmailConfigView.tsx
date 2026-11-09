import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailConfigSchema, EmailConfigFormData } from '../../schema/email-config.schema';
import { useGetEmailConfig, useUpdateEmailConfig } from '../../hooks/useEmailConfig';
import { Mail, Bookmark, Check, Loader2 } from 'lucide-react';
import { SkeletonTable } from '../../components/common/SkeletonTable';

export const EmailConfigView: React.FC = () => {
  const { config, isLoading } = useGetEmailConfig();
  const { updateConfig } = useUpdateEmailConfig();
  const [isSaved, setIsSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmailConfigFormData>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      isEnabled: true,
      dailySendTime: '09:00',
      remindBefore7Days: true,
      remindBefore3Days: true,
      remindBefore1Day: true,
      remindOnDueDate: true,
      recipientEmails: '',
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        isEnabled: config.isEnabled ?? config.is_enabled,
        dailySendTime: config.dailySendTime ?? config.daily_send_time ?? '09:00',
        remindBefore7Days: config.remindBefore7Days ?? config.remind_before_7_days ?? true,
        remindBefore3Days: config.remindBefore3Days ?? config.remind_before_3_days ?? true,
        remindBefore1Day: config.remindBefore1Day ?? config.remind_before_1_day ?? true,
        remindOnDueDate: config.remindOnDueDate ?? config.remind_on_due_date ?? true,
        recipientEmails: config.recipientEmails ?? config.recipient_emails ?? '',
      });
    }
  }, [config, reset]);

  const handleFormSubmit = async (data: EmailConfigFormData) => {
    const saved = await updateConfig(data);
    reset({
      isEnabled: saved.isEnabled ?? saved.is_enabled,
      dailySendTime: saved.dailySendTime ?? saved.daily_send_time,
      remindBefore7Days: saved.remindBefore7Days ?? saved.remind_before_7_days,
      remindBefore3Days: saved.remindBefore3Days ?? saved.remind_before_3_days,
      remindBefore1Day: saved.remindBefore1Day ?? saved.remind_before_1_day,
      remindOnDueDate: saved.remindOnDueDate ?? saved.remind_on_due_date,
      recipientEmails: saved.recipientEmails ?? saved.recipient_emails,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="bg-white/90 p-6 rounded-3xl shadow-sm">
        <SkeletonTable rows={2} cols={7} />
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-purple-600 font-semibold italic">Tab quản lý</span>
              <h2 className="text-xl font-black text-purple-900 tracking-tight">CẤU HÌNH EMAIL</h2>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                ĐANG LƯU...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                ĐÃ LƯU THÀNH CÔNG
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                LƯU GIỜ GỬI
              </>
            )}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto border border-purple-200 rounded-2xl">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-purple-600 text-white font-bold divide-x divide-purple-400">
                <th className="py-3 px-3">Bật gửi email</th>
                <th className="py-3 px-3">Giờ gửi mỗi ngày</th>
                <th className="py-3 px-3">Nhắc trước 7 ngày</th>
                <th className="py-3 px-3">Nhắc trước 3 ngày</th>
                <th className="py-3 px-3">Nhắc trước 1 ngày</th>
                <th className="py-3 px-3">Nhắc trong ngày</th>
                <th className="py-3 px-4 text-left">Email nhận thông báo</th>
              </tr>
              <tr className="bg-purple-200/60 text-purple-900 text-[10px] italic divide-x divide-purple-300">
                <td className="py-1">Chọn</td>
                <td className="py-1">Điền</td>
                <td className="py-1">Chọn</td>
                <td className="py-1">Chọn</td>
                <td className="py-1">Chọn</td>
                <td className="py-1">Chọn</td>
                <td className="py-1 px-4 text-left">Điền</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              <tr className="divide-x divide-purple-100 align-top">
                <td className="py-4 px-2">
                  <select
                    {...register('isEnabled', { setValueAs: (v) => v === 'yes' || v === true })}
                    value={watch('isEnabled') ? 'yes' : 'no'}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </td>
                <td className="py-4 px-2">
                  <input
                    type="time"
                    {...register('dailySendTime')}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                  />
                  {errors.dailySendTime && (
                    <p className="text-red-500 text-[10px] mt-1">{errors.dailySendTime.message}</p>
                  )}
                </td>
                <td className="py-4 px-2">
                  <select
                    {...register('remindBefore7Days', { setValueAs: (v) => v === 'yes' || v === true })}
                    value={watch('remindBefore7Days') ? 'yes' : 'no'}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </td>
                <td className="py-4 px-2">
                  <select
                    {...register('remindBefore3Days', { setValueAs: (v) => v === 'yes' || v === true })}
                    value={watch('remindBefore3Days') ? 'yes' : 'no'}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </td>
                <td className="py-4 px-2">
                  <select
                    {...register('remindBefore1Day', { setValueAs: (v) => v === 'yes' || v === true })}
                    value={watch('remindBefore1Day') ? 'yes' : 'no'}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </td>
                <td className="py-4 px-2">
                  <select
                    {...register('remindOnDueDate', { setValueAs: (v) => v === 'yes' || v === true })}
                    value={watch('remindOnDueDate') ? 'yes' : 'no'}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </td>
                <td className="py-4 px-4 text-left">
                  <textarea
                    rows={2}
                    {...register('recipientEmails')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {errors.recipientEmails && (
                    <p className="text-red-500 text-[10px] mt-1">{errors.recipientEmails.message}</p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};

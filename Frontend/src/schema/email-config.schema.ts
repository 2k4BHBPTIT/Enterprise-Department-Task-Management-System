import { z } from 'zod';

export const emailConfigSchema = z.object({
  isEnabled: z.boolean().default(true),
  dailySendTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ gửi phải có định dạng HH:mm (VD: 09:00)'),
  remindBefore7Days: z.boolean().default(true),
  remindBefore3Days: z.boolean().default(true),
  remindBefore1Day: z.boolean().default(true),
  remindOnDueDate: z.boolean().default(true),
  recipientEmails: z
    .string({ required_error: 'Danh sách email nhận thông báo không được để trống' })
    .min(5, 'Vui lòng nhập ít nhất một địa chỉ email')
    .refine(
      (emails) => {
        const list = emails.split(',').map((e) => e.trim()).filter(Boolean);
        if (list.length === 0) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return list.every((item) => emailRegex.test(item));
      },
      {
        message: 'Chứa địa chỉ email không đúng định dạng. Các email cách nhau bằng dấu phẩy.',
      }
    ),
});

export type EmailConfigFormData = z.infer<typeof emailConfigSchema>;

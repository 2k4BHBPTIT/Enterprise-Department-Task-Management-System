import { z } from 'zod';

export const projectSchema = z
  .object({
    name: z
      .string({ required_error: 'Tên dự án không được để trống' })
      .min(3, 'Tên dự án phải có ít nhất 3 ký tự')
      .max(100, 'Tên dự án không quá 100 ký tự'),
    description: z
      .string()
      .max(300, 'Mô tả không được vượt quá 300 ký tự')
      .optional()
      .default(''),
    departmentId: z
      .string({ required_error: 'Vui lòng chọn phòng ban phụ trách' })
      .min(1, 'Vui lòng chọn phòng ban phụ trách'),
    pmId: z
      .string({ required_error: 'Vui lòng chỉ định Project Manager (PM)' })
      .min(1, 'Vui lòng chỉ định Project Manager (PM)'),
    startDate: z
      .string({ required_error: 'Vui lòng chọn ngày bắt đầu' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
    endDate: z
      .string({ required_error: 'Vui lòng chọn ngày kết thúc' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày kết thúc không hợp lệ (YYYY-MM-DD)'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end >= start;
    },
    {
      message: 'Ngày kết thúc phải diễn ra sau hoặc cùng ngày bắt đầu',
      path: ['endDate'],
    }
  );

export type ProjectFormData = z.infer<typeof projectSchema>;

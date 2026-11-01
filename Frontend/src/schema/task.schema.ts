import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề công việc không được để trống' })
    .min(3, 'Tiêu đề công việc phải có ít nhất 3 ký tự')
    .max(150, 'Tiêu đề không được vượt quá 150 ký tự'),
  description: z
    .string()
    .max(500, 'Mô tả không quá 500 ký tự')
    .optional()
    .default(''),
  projectId: z
    .string({ required_error: 'Vui lòng chọn dự án' })
    .min(1, 'Vui lòng chọn dự án'),
  departmentId: z
    .string({ required_error: 'Vui lòng chọn bộ phận' })
    .min(1, 'Vui lòng chọn bộ phận'),
  // Nghiệp vụ cốt lõi: Mỗi task CHỈ CÓ 1 Assignee
  assigneeId: z
    .string({ required_error: 'Mỗi công việc bắt buộc phải có 1 người chịu trách nhiệm chính' })
    .min(1, 'Vui lòng chỉ định người chịu trách nhiệm chính (Assignee)'),
  // Nghiệp vụ: Nhiều Followers
  followerIds: z.array(z.string()).default([]),
  dependencyIds: z.array(z.string()).default([]),
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: 'Vui lòng chọn mức độ ưu tiên',
  }),
  taskType: z.enum(['PLANNING', 'DEVELOPMENT', 'DESIGN', 'MARKETING', 'TESTING', 'OTHER'], {
    required_error: 'Vui lòng chọn phân loại công việc',
  }),
  dueDate: z
    .string({ required_error: 'Hạn chót không được để trống' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng hạn chót phải là YYYY-MM-DD')
    .refine(
      (val) => {
        const todayStr = new Date().toISOString().split('T')[0];
        return val >= todayStr;
      },
      {
        message: 'Hạn chót không được chọn ngày trong quá khứ',
      }
    ),
  isImportant: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
});

export type TaskFormData = z.infer<typeof taskSchema>;

import { z } from 'zod';

export const reassignSchema = z.object({
  taskId: z.string().min(1, 'Mã công việc không hợp lệ'),
  newAssigneeId: z
    .string({ required_error: 'Vui lòng chọn nhân sự tiếp nhận mới' })
    .min(1, 'Vui lòng chọn người chịu trách nhiệm mới'),
  reason: z
    .string({ required_error: 'Vui lòng nhập lý do chuyển giao công việc' })
    .min(5, 'Lý do bàn giao phải có ít nhất 5 ký tự')
    .max(200, 'Lý do không quá 200 ký tự'),
});

export type ReassignFormData = z.infer<typeof reassignSchema>;

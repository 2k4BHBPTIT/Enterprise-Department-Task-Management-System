import { EmailNotificationConfig } from '../../types';
import { EmailConfigFormData } from '../../schema/email-config.schema';

export const emailApi = {
  getConfig: async (): Promise<EmailNotificationConfig> => {
    throw new Error('Backend hiện chưa cung cấp API cấu hình email trong tài liệu Swagger.');
  },

  updateConfig: async (_data: EmailConfigFormData): Promise<EmailNotificationConfig> => {
    throw new Error('Backend hiện chưa cung cấp API cấu hình email trong tài liệu Swagger.');
  },
};

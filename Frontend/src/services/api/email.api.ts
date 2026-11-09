import { EmailNotificationConfig } from '../../types';
import { EmailConfigFormData } from '../../schema/email-config.schema';
import { apiClient, ApiResponse, unwrapResponse } from './client';

const STORAGE_KEY = 'emailNotificationConfig';

const defaults: EmailNotificationConfig = {
  is_enabled: true,
  isEnabled: true,
  daily_send_time: '09:00',
  dailySendTime: '09:00',
  remind_before_7_days: true,
  remindBefore7Days: true,
  remind_before_3_days: true,
  remindBefore3Days: true,
  remind_before_1_day: true,
  remindBefore1Day: true,
  remind_on_due_date: true,
  remindOnDueDate: true,
  recipient_emails: '',
  recipientEmails: '',
};

const normalizeConfig = (config: Partial<EmailNotificationConfig>): EmailNotificationConfig => ({
  ...defaults,
  ...config,
  is_enabled: config.is_enabled ?? config.isEnabled ?? true,
  isEnabled: config.isEnabled ?? config.is_enabled ?? true,
  daily_send_time: config.daily_send_time ?? config.dailySendTime ?? '09:00',
  dailySendTime: config.dailySendTime ?? config.daily_send_time ?? '09:00',
  remind_before_7_days: config.remind_before_7_days ?? config.remindBefore7Days ?? true,
  remindBefore7Days: config.remindBefore7Days ?? config.remind_before_7_days ?? true,
  remind_before_3_days: config.remind_before_3_days ?? config.remindBefore3Days ?? true,
  remindBefore3Days: config.remindBefore3Days ?? config.remind_before_3_days ?? true,
  remind_before_1_day: config.remind_before_1_day ?? config.remindBefore1Day ?? true,
  remindBefore1Day: config.remindBefore1Day ?? config.remind_before_1_day ?? true,
  remind_on_due_date: config.remind_on_due_date ?? config.remindOnDueDate ?? true,
  remindOnDueDate: config.remindOnDueDate ?? config.remind_on_due_date ?? true,
  recipient_emails: config.recipient_emails ?? config.recipientEmails ?? '',
  recipientEmails: config.recipientEmails ?? config.recipient_emails ?? '',
});

const getStoredConfig = (): EmailNotificationConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeConfig(stored ? JSON.parse(stored) as Partial<EmailNotificationConfig> : {});
  } catch {
    return { ...defaults };
  }
};

const toBackendPayload = (data: EmailConfigFormData): Record<string, unknown> => ({
  isEnabled: data.isEnabled,
  dailySendTime: data.dailySendTime,
  remindBefore7Days: data.remindBefore7Days,
  remindBefore3Days: data.remindBefore3Days,
  remindBefore1Day: data.remindBefore1Day,
  remindOnDueDate: data.remindOnDueDate,
  recipientEmails: data.recipientEmails,
});

const unwrapConfig = (response: ApiResponse<EmailNotificationConfig> | EmailNotificationConfig) =>
  normalizeConfig('success' in response ? unwrapResponse(response) : response);

export const emailApi = {
  getConfig: async (): Promise<EmailNotificationConfig> => {
    try {
      const response = await apiClient.get<ApiResponse<EmailNotificationConfig> | EmailNotificationConfig>('/email-config');
      return unwrapConfig(response.data);
    } catch {
      return getStoredConfig();
    }
  },

  updateConfig: async (data: EmailConfigFormData): Promise<EmailNotificationConfig> => {
    const normalized = normalizeConfig({
      is_enabled: data.isEnabled,
      isEnabled: data.isEnabled,
      daily_send_time: data.dailySendTime,
      dailySendTime: data.dailySendTime,
      remind_before_7_days: data.remindBefore7Days,
      remindBefore7Days: data.remindBefore7Days,
      remind_before_3_days: data.remindBefore3Days,
      remindBefore3Days: data.remindBefore3Days,
      remind_before_1_day: data.remindBefore1Day,
      remindBefore1Day: data.remindBefore1Day,
      remind_on_due_date: data.remindOnDueDate,
      remindOnDueDate: data.remindOnDueDate,
      recipient_emails: data.recipientEmails,
      recipientEmails: data.recipientEmails,
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    try {
      const response = await apiClient.put<ApiResponse<EmailNotificationConfig> | EmailNotificationConfig>(
        '/email-config',
        toBackendPayload(data),
      );
      const saved = unwrapConfig(response.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return saved;
    } catch {
      return normalized;
    }
  },
};

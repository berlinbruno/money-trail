declare module 'react-native-get-sms-android' {
  export interface Sms {
    _id: string;
    thread_id: string;
    address: string; // phone number or sender
    person: string;
    date: number; // timestamp
    date_sent: number;
    body: string; // message text
    read: number; // 0 = unread, 1 = read
    status: number;
    type: number; // 1 = inbox, 2 = sent
    service_center: string;
    locked?: number;
    error_code?: number;
    sub_id?: number;
    seen?: number;
    deletable?: number;
    sim_slot?: number;
    hidden?: number;
    app_id?: number;
    msg_id?: number;
    reserved?: number;
    pri?: number;
    teleservice_id?: number;
    svc_cmd?: number;
    roam_pending?: number;
    spam_report?: number;
    secret_mode?: number;
    safe_message?: number;
    favorite?: number;
  }

  export interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | '';
    address?: string;
    body?: string;
    bodyRegex?: string;
    minDate?: number;
    maxDate?: number;
    read?: number;
    _id?: number;
    thread_id?: number;
    indexFrom?: number;
    maxCount?: number;
  }

  type FailCallback = (error: string) => void;
  type SuccessCallback = (count: number, smsList: string) => void;
  type SmsReceivedCallback = (sms: { address: string; body: string; date: number }) => void;

  interface SmsAndroidStatic {
    list(filter: string | SmsFilter, fail: FailCallback, success: SuccessCallback): void;
    startWatch(success: () => void, fail: (error: any) => void): void;
    stopWatch(): void;
    on(event: 'received', callback: SmsReceivedCallback): { remove: () => void };
  }

  const SmsAndroid: SmsAndroidStatic;
  export default SmsAndroid;
}

import type { ActorRole, ISODateString, LocalizedText } from "@/features/orders/model/common";

export enum NotificationChannel {
  InApp = "in_app",
  Sms = "sms",
  Email = "email",
  Push = "push",
}

export enum NotificationStatus {
  Pending = "pending",
  Sent = "sent",
  Failed = "failed",
  Read = "read",
}

export interface PlatformNotification {
  id: string;
  recipientRole: ActorRole;
  recipientEntityId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: LocalizedText;
  body: LocalizedText;
  orderId?: string;
  assignmentId?: string;
  createdAt: ISODateString;
  sentAt?: ISODateString;
  readAt?: ISODateString;
}

export type Notification = PlatformNotification;

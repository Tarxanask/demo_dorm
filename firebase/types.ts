export interface NotificationPreferences {
  enabledDorms: string[]; // List of dorm IDs to receive notifications from
  messageNotifications: boolean; // Receive chat notifications
  eventNotifications: boolean; // Receive event notifications
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  dorm: DormType;
  memberDorms?: DormType[]; // All dorms user is a member of
  faculty: string;
  hobbies: string[];
  createdAt: Date;
  notificationPreferences?: NotificationPreferences;
  isESNAdmin?: boolean; // ESN admin flag
  esnUniversity?: 'VMU' | 'KTU' | 'LSMU'; // Which ESN section they manage
}

export type DormType = 'KTU' | 'LSMU' | 'Solo Society' | 'VMU Dorms' | 'Other Dorms' | 'General Community' | 'Global';

export interface Dorm {
  id: DormType;
  name: string;
  location: string;
  facilities: string[];
  memberCount: number;
}

export interface ChatMessage {
  id: string;
  dormId: DormType;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  replyTo?: string;
  replyToMessage?: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
}

export interface EventChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  replyTo?: string;
  replyToMessage?: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
}

export interface Event {
  id: string;
  dormId: DormType;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  isHostResident: boolean;
  title: string;
  description: string;
  location?: string; // Event location/address
  date: string;
  time: string;
  desiredParticipants: number;
  maxParticipants: number;
  residentsOnly: boolean;
  participants: string[];
  anonymousParticipants?: string[]; // UIDs of participants who want to join anonymously
  imageURL?: string;
  createdAt: Date;
  isESNEvent?: boolean; // Flag for ESN events
  esnUniversity?: 'VMU' | 'KTU' | 'LSMU'; // Which ESN section this belongs to
  customFormFields?: CustomFormField[]; // Custom registration fields
  formResponses?: { [userId: string]: { [fieldId: string]: string } }; // User responses to custom fields
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[]; // For radio button fields
}


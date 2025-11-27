export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  dorm: DormType;
  faculty: string;
  hobbies: string[];
  createdAt: Date;
}

export type DormType = 'KTU' | 'LSMU' | 'Solo Society' | 'Baltija VDU' | 'Other Dorms' | 'General Community' | 'Global';

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

export interface Event {
  id: string;
  dormId: DormType;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  isHostResident: boolean;
  title: string;
  description: string;
  date: string;
  time: string;
  desiredParticipants: number;
  maxParticipants: number;
  residentsOnly: boolean;
  participants: string[];
  imageURL?: string;
  createdAt: Date;
}


export interface Channels {
  id: string;
  name: string;
  description?: string;
  initials: string;
  isDirectMessage: boolean;
  members: Member[];
  unreadCount: number;
  lastMessage: LastMessage;
  avatar?: string;
}



export interface LastMessage {
  content: string;
  timestamp: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  status: Status;
}

export enum Status {
  Away = 'away',
  Offline = 'offline',
  Online = 'online',
}

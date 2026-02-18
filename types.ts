export enum MessageSender {
  User,
  AI,
}

export interface TranscriptMessage {
  sender: MessageSender;
  text: string;
  id: number;
}

export enum SessionState {
  Idle = 'IDLE',
  Listening = 'LISTENING',
  Processing = 'PROCESSING', // Kept for potential future use, though Live API merges this with Listening/Speaking
  Speaking = 'SPEAKING',
}

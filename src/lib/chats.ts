const CHATS_API = 'https://functions.poehali.dev/737f5054-182e-45da-bbb5-f17df2becc92';

export interface Chat {
  id: number;
  client_name: string;
  client_email?: string;
  assigned_operator_id?: number;
  assigned_operator_name?: string;
  status: 'waiting' | 'active' | 'closed';
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_type: 'client' | 'operator' | 'system';
  sender_id?: number;
  sender_name?: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export const chatsService = {
  async getChats(status?: string): Promise<Chat[]> {
    const url = status ? `${CHATS_API}?status=${status}` : CHATS_API;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return response.json();
  },

  async createChat(clientName: string, clientEmail?: string): Promise<Chat> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_chat',
        client_name: clientName,
        client_email: clientEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create chat');
    }

    return response.json();
  },

  async getMessages(chatId: number): Promise<Message[]> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_messages',
        chat_id: chatId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  async sendMessage(
    chatId: number,
    messageText: string,
    senderType: 'client' | 'operator' = 'client',
    senderId?: number
  ): Promise<Message> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_message',
        chat_id: chatId,
        sender_type: senderType,
        sender_id: senderId,
        message_text: messageText,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  },

  async closeChat(chatId: number): Promise<void> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'close_chat',
        chat_id: chatId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to close chat');
    }
  },

  async escalateChat(chatId: number, toOperatorId?: number): Promise<void> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'escalate_chat',
        chat_id: chatId,
        to_operator_id: toOperatorId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to escalate chat');
    }
  },

  async addNote(chatId: number, operatorId: number, noteText: string): Promise<any> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_note',
        chat_id: chatId,
        operator_id: operatorId,
        note_text: noteText,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add note');
    }

    return response.json();
  },

  async getNotes(chatId: number): Promise<any[]> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_notes',
        chat_id: chatId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }

    return response.json();
  },

  async addQCRating(
    chatId: number,
    operatorId: number,
    qcUserId: number,
    score: number,
    comment?: string
  ): Promise<any> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_qc_rating',
        chat_id: chatId,
        operator_id: operatorId,
        qc_user_id: qcUserId,
        score,
        comment,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add QC rating');
    }

    return response.json();
  },

  async getQCRatings(operatorId?: number): Promise<any[]> {
    const response = await fetch(CHATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_qc_ratings',
        operator_id: operatorId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QC ratings');
    }

    return response.json();
  },
};
import { create } from 'zustand';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import type { Conversation, Message, ApiResponse } from '../types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<Conversation>;
  selectConversation: (conversationId: string) => Promise<void>;
  updateConversation: (conversationId: string, data: { title?: string; isArchived?: boolean }) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, model?: string) => Promise<void>;
  
  clearCurrentConversation: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<{ conversations: Conversation[]; total: number }>>(
        '/conversations'
      );

      if (response.data.success && response.data.data) {
        set({ conversations: response.data.data.conversations, isLoading: false });
      }
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Failed to fetch conversations:', error);
    }
  },

  createConversation: async (title) => {
    try {
      const response = await api.post<ApiResponse<{ conversation: Conversation }>>(
        '/conversations',
        { title }
      );

      if (response.data.success && response.data.data) {
        const newConversation = response.data.data.conversation;
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
        }));
        toast.success('Conversation created');
        return newConversation;
      }
      throw new Error('Failed to create conversation');
    } catch (error: any) {
      toast.error('Failed to create conversation');
      throw error;
    }
  },

  selectConversation: async (conversationId) => {
    set({ isLoading: true });
    try {
      const [convResponse, messagesResponse] = await Promise.all([
        api.get<ApiResponse<{ conversation: Conversation }>>(`/conversations/${conversationId}`),
        api.get<ApiResponse<{ messages: Message[] }>>(`/conversations/${conversationId}/messages`),
      ]);

      if (convResponse.data.success && messagesResponse.data.success) {
        set({
          currentConversation: convResponse.data.data!.conversation,
          messages: messagesResponse.data.data!.messages,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('Failed to load conversation');
    }
  },

  updateConversation: async (conversationId, data) => {
    try {
      const response = await api.patch<ApiResponse<{ conversation: Conversation }>>(
        `/conversations/${conversationId}`,
        data
      );

      if (response.data.success && response.data.data) {
        const updated = response.data.data.conversation;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? updated : c
          ),
          currentConversation:
            state.currentConversation?.id === conversationId
              ? updated
              : state.currentConversation,
        }));
        toast.success('Conversation updated');
      }
    } catch (error: any) {
      toast.error('Failed to update conversation');
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/conversations/${conversationId}`);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== conversationId),
        currentConversation:
          state.currentConversation?.id === conversationId
            ? null
            : state.currentConversation,
        messages: state.currentConversation?.id === conversationId ? [] : state.messages,
      }));
      toast.success('Conversation deleted');
    } catch (error: any) {
      toast.error('Failed to delete conversation');
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<{ messages: Message[] }>>(
        `/conversations/${conversationId}/messages`
      );

      if (response.data.success && response.data.data) {
        set({ messages: response.data.data.messages, isLoading: false });
      }
    } catch (error: any) {
      set({ isLoading: false });
      toast.error('Failed to load messages');
    }
  },

  sendMessage: async (conversationId, content, model) => {
    set({ isSending: true });
    try {
      const response = await api.post<ApiResponse<{ userMessage: Message; assistantMessage: Message }>>(
        `/conversations/${conversationId}/messages`,
        { content, model }
      );

      if (response.data.success && response.data.data) {
        const { userMessage, assistantMessage } = response.data.data;
        set((state) => ({
          messages: [...state.messages, userMessage, assistantMessage],
          isSending: false,
        }));
      }
    } catch (error: any) {
      set({ isSending: false });
      toast.error('Failed to send message');
      throw error;
    }
  },

  clearCurrentConversation: () => {
    set({ currentConversation: null, messages: [] });
  },

  reset: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      isSending: false,
    });
  },
}));
import type { Conversation } from '../types';

const STORAGE_KEY = 'chat_conversations';

const isBrowser = typeof window !== 'undefined';

const parseConversations = (rawValue: string | null): Conversation[] => {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse stored conversations', error);
  }
  return [];
};

export const loadConversations = (): Conversation[] => {
  if (!isBrowser) {
    return [];
  }
  return parseConversations(window.localStorage.getItem(STORAGE_KEY));
};

export const saveConversations = (conversations: Conversation[]): void => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

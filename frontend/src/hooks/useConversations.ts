import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import * as convService from '../services/conversations';
import { ConversationGroup, Conversation } from '../types/conversation';

export function useConversations() {
  const {
    conversations,
    setConversations,
    addConversation,
    updateConversationTitleInStore,
    removeConversationFromStore,
    setActiveThreadId,
  } = useChatStore();

  const refreshConversations = async () => {
    try {
      const res = await convService.listConversations();
      setConversations(res.conversations);
    } catch (e) {
      console.error('Failed to list conversations:', e);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  const createNewChat = async (): Promise<string> => {
    const threadId = crypto.randomUUID();
    const newConv = await convService.createConversation('New Conversation', threadId);
    addConversation(newConv);
    setActiveThreadId(newConv.id);
    return newConv.id;
  };

  const renameConversation = async (id: string, newTitle: string) => {
    updateConversationTitleInStore(id, newTitle);
    try {
      await convService.updateConversationTitle(id, newTitle);
    } catch (e) {
      console.error('Rename conversation failed:', e);
      refreshConversations();
    }
  };

  const deleteConversation = async (id: string) => {
    removeConversationFromStore(id);
    try {
      await convService.deleteConversation(id);
    } catch (e) {
      console.error('Delete conversation failed:', e);
      refreshConversations();
    }
  };

  // Date grouping
  const groupConversations = (items: Conversation[]): ConversationGroup[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 7 * 86400000;

    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    items.forEach((c) => {
      const time = new Date(c.updated_at).getTime();
      if (time >= todayStart) {
        today.push(c);
      } else if (time >= yesterdayStart) {
        yesterday.push(c);
      } else if (time >= sevenDaysStart) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    const groups: ConversationGroup[] = [];
    if (today.length > 0) groups.push({ label: 'Today', conversations: today });
    if (yesterday.length > 0) groups.push({ label: 'Yesterday', conversations: yesterday });
    if (previous7Days.length > 0) groups.push({ label: 'Previous 7 Days', conversations: previous7Days });
    if (older.length > 0) groups.push({ label: 'Older', conversations: older });

    return groups;
  };

  return {
    conversations,
    groupedConversations: groupConversations(conversations),
    refreshConversations,
    createNewChat,
    renameConversation,
    deleteConversation,
  };
}

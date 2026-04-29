import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Bell,
  Circle,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { messagingApi } from '../api/services';
import { connectMessagingSocket, disconnectMessagingSocket, getMessagingSocket } from '../api/messagingSocket';
import { useAuth } from '../context/AuthContext';
import { Message, MessageCategory, MessageConversation, MessagePriority, MessagingUser } from '../types';

const userCanBroadcast = (role?: string) => {
  return ['SUPER_ADMIN', 'ADMIN', 'HR', 'TEAM_LEADER'].includes(role || '');
};

const priorityBadge: Record<MessagePriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

const categoryOptions: MessageCategory[] = [
  'GENERAL',
  'COURSE',
  'LEAVE',
  'ATTENDANCE',
  'HR',
  'ANNOUNCEMENT',
  'REMINDER',
];

const priorityOptions: MessagePriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<MessagingUser[]>([]);
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<MessageConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('GENERAL');
  const [selectedPriority, setSelectedPriority] = useState<MessagePriority>('NORMAL');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTitle, setBulkTitle] = useState('Course Reminder');
  const [bulkMessage, setBulkMessage] = useState('Please complete your pending LMS module this week.');
  const [bulkTargets, setBulkTargets] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const selectedConversationId = selectedConversation?.id;

  const otherTypingUsers = useMemo(() => {
    if (!selectedConversation) return [];

    return selectedConversation.participants
      .map((item) => item.user)
      .filter((participant) => participant.id !== user?.id && typingUsers[participant.id]);
  }, [selectedConversation, typingUsers, user?.id]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await messagingApi.getConversations();
      if (response.data.success) {
        const list: MessageConversation[] = response.data.data.conversations || [];
        setConversations(list);

        if (!selectedConversationId && list.length > 0) {
          setSelectedConversation(list[0]);
        } else if (selectedConversationId) {
          const matched = list.find((item) => item.id === selectedConversationId);
          if (matched) {
            setSelectedConversation(matched);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await messagingApi.searchUsers(search);
      if (response.data.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await messagingApi.getMessages(conversationId, { page: 1, limit: 50 });
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        await messagingApi.markRead(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStartDirect = async (targetUserId: string) => {
    try {
      const response = await messagingApi.createDirectConversation(targetUserId);
      if (response.data.success) {
        await loadConversations();
        const created: MessageConversation = response.data.data.conversation;
        setSelectedConversation(created);
      }
    } catch (error) {
      console.error('Error creating direct conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageText.trim() && attachments.length === 0)) {
      return;
    }

    try {
      const response = await messagingApi.sendMessage(selectedConversation.id, {
        content: messageText.trim() || 'Attachment',
        category: selectedCategory,
        priority: selectedPriority,
        courseCode: courseCode || undefined,
        courseTitle: courseTitle || undefined,
        attachments,
      });

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data.message]);
        setMessageText('');
        setAttachments([]);
        setCourseCode('');
        setCourseTitle('');
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      const response = await messagingApi.uploadFiles(files);
      if (response.data.success) {
        setAttachments((prev) => [...prev, ...(response.data.data.files || [])]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      event.target.value = '';
    }
  };

  const handleTyping = () => {
    const socket = getMessagingSocket();
    if (!socket || !selectedConversation) {
      return;
    }

    socket.emit('typing:start', { conversationId: selectedConversation.id });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('typing:stop', { conversationId: selectedConversation.id });
    }, 900);
  };

  const handleSendBulk = async () => {
    if (!bulkTargets.length || !bulkTitle.trim() || !bulkMessage.trim()) {
      return;
    }

    try {
      await messagingApi.sendBulkAnnouncement({
        title: bulkTitle,
        content: bulkMessage,
        targetUserIds: bulkTargets,
        category: 'REMINDER',
        priority: 'HIGH',
        courseCode: courseCode || undefined,
        courseTitle: courseTitle || undefined,
        isAnnouncement: true,
        isBulkReminder: true,
      });
      setBulkOpen(false);
      setBulkTargets([]);
      await loadConversations();
    } catch (error) {
      console.error('Error sending bulk reminder:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    loadMessages(selectedConversation.id);

    const socket = getMessagingSocket();
    socket?.emit('conversation:join', { conversationId: selectedConversation.id });

    return () => {
      socket?.emit('conversation:leave', { conversationId: selectedConversation.id });
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    const socket = connectMessagingSocket();
    if (!socket) {
      return;
    }

    socket.on('message:new', async (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId === selectedConversationId) {
        setMessages((prev) => [...prev, payload.message]);
        await messagingApi.markRead(payload.conversationId);
      }
      await loadConversations();
    });

    socket.on('announcement:new', async () => {
      await loadConversations();
    });

    socket.on(
      'typing:update',
      (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (payload.conversationId !== selectedConversationId) {
          return;
        }

        setTypingUsers((prev) => ({
          ...prev,
          [payload.userId]: payload.isTyping,
        }));
      }
    );

    socket.on('presence:update', (payload: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.isOnline,
      }));
    });

    socket.on('conversation:read', async () => {
      await loadConversations();
    });

    return () => {
      socket.off('message:new');
      socket.off('announcement:new');
      socket.off('typing:update');
      socket.off('presence:update');
      socket.off('conversation:read');
      disconnectMessagingSocket();
    };
  }, [selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTypingUsers.length]);

  return (
    <div className="h-[calc(100vh-6rem)] min-h-[700px] rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex">
      <aside className="w-[340px] border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          {userCanBroadcast(user?.role) && (
            <button
              onClick={() => setBulkOpen((prev) => !prev)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Bulk Course Reminder
            </button>
          )}
        </div>

        {bulkOpen && (
          <div className="p-4 border-b border-gray-100 space-y-2 bg-amber-50">
            <input
              value={bulkTitle}
              onChange={(e) => setBulkTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm"
              placeholder="Title"
            />
            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm"
              rows={2}
              placeholder="Reminder message"
            />
            <input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm"
              placeholder="Course code (optional)"
            />
            <input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm"
              placeholder="Course title (optional)"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {users.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={bulkTargets.includes(item.id)}
                    onChange={(e) => {
                      setBulkTargets((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                      );
                    }}
                  />
                  {item.fullName} ({item.employeeCode})
                </label>
              ))}
            </div>
            <button
              onClick={handleSendBulk}
              className="w-full py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold"
            >
              Send Reminder
            </button>
          </div>
        )}

        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.16em]">Start Conversation</p>
          <div className="mt-2 max-h-28 overflow-y-auto space-y-1">
            {users.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => handleStartDirect(item.id)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-700">{item.fullName}</p>
                <p className="text-xs text-gray-500">{item.employeeCode}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-sm text-gray-500">Loading conversations...</div>
          ) : (
            conversations.map((conversation) => {
              const active = selectedConversation?.id === conversation.id;
              const peer = conversation.participants.find((item) => item.user.id !== user?.id)?.user;
              const title = conversation.type === 'DIRECT' ? peer?.fullName || 'Direct Chat' : conversation.title || 'Group';
              const subtitle = conversation.lastMessage?.content || 'No messages yet';

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50 ${active ? 'bg-primary-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                      <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                    </div>
                    <div className="text-right">
                      {conversation.unreadCount ? (
                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] px-1">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>Select conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {selectedConversation.type === 'DIRECT'
                    ? selectedConversation.participants.find((item) => item.user.id !== user?.id)?.user.fullName || 'Direct Chat'
                    : selectedConversation.title || 'Conversation'}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedConversation.type === 'COURSE' && selectedConversation.courseCode
                    ? `${selectedConversation.courseCode} - ${selectedConversation.courseTitle || 'Course context'}`
                    : 'Internal LMS messaging'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {selectedConversation.participants
                  .filter((item) => item.user.id !== user?.id)
                  .slice(0, 3)
                  .map((item) => (
                    <span key={item.user.id} className="inline-flex items-center gap-1">
                      <Circle
                        className={`w-2.5 h-2.5 ${onlineUsers[item.user.id] ? 'text-emerald-500 fill-emerald-500' : 'text-gray-300 fill-gray-300'}`}
                      />
                      {item.user.employeeCode}
                    </span>
                  ))}
              </div>
            </header>

            <section className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <p className="text-sm text-gray-500">Loading messages...</p>
              ) : (
                messages.map((message) => {
                  const own = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${own ? 'bg-primary-600 text-white' : 'bg-white text-gray-800'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-xs font-semibold ${own ? 'text-primary-100' : 'text-gray-500'}`}>{message.sender.fullName}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${own ? 'bg-primary-500 text-white' : priorityBadge[message.priority]}`}>
                            {message.priority}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {(message.courseCode || message.courseTitle) && (
                          <div className={`mt-2 rounded-xl p-2 text-xs border ${own ? 'border-primary-400 bg-primary-500/30' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                            <div className="flex items-center gap-1 mb-1 font-semibold">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              LMS Course Context
                            </div>
                            <p>{message.courseCode || 'COURSE'} {message.courseTitle ? `• ${message.courseTitle}` : ''}</p>
                          </div>
                        )}

                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <a
                                key={`${message.id}-${attachment.fileUrl}`}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`block text-xs underline ${own ? 'text-primary-100' : 'text-primary-600'}`}
                              >
                                {attachment.fileName}
                              </a>
                            ))}
                          </div>
                        )}

                        <p className={`mt-2 text-[10px] ${own ? 'text-primary-100' : 'text-gray-400'}`}>
                          {format(new Date(message.createdAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {otherTypingUsers.length > 0 && (
                <p className="text-xs text-gray-500">
                  {otherTypingUsers.map((item) => item.fullName).join(', ')} typing...
                </p>
              )}

              <div ref={bottomRef} />
            </section>

            <footer className="border-t border-gray-100 p-4 space-y-3 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as MessageCategory)}
                  className="px-2 py-2 border rounded-lg text-xs"
                >
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as MessagePriority)}
                  className="px-2 py-2 border rounded-lg text-xs"
                >
                  {priorityOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Course code"
                  className="px-3 py-2 border rounded-lg text-xs"
                />
                <input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Course title"
                  className="px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <span key={`${attachment.fileUrl}-${index}`} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                      {attachment.fileName}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <input type="file" multiple className="hidden" onChange={handleUpload} />
                </label>
                <input
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default Messages;

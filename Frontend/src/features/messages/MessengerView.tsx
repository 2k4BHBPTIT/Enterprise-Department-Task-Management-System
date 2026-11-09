import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Pencil,
  Search,
  Send,
} from 'lucide-react';
import { userApi } from '../../services/api/user.api';
import { useAuthStore } from '../../store/auth.store';
import { User } from '../../types';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  sentAt: string;
}

type Conversations = Record<string, ChatMessage[]>;

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || '?';

const getStorageKey = (userId: number | string) => `messengerConversations:${userId}`;

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatConversationTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? formatMessageTime(value)
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
};

export const MessengerView: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [contacts, setContacts] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversations>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    userApi.getUsers()
      .then((users) => {
        if (!active) return;
        const availableContacts = users.filter((user) =>
          String(user.id) !== String(currentUser.id) && user.status === 'ACTIVE',
        );
        setContacts(availableContacts);
        setSelectedContactId((selectedId) =>
          selectedId && availableContacts.some((user) => String(user.id) === selectedId)
            ? selectedId
            : null,
        );
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách nhân sự.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    try {
      const stored = localStorage.getItem(getStorageKey(currentUser.id));
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setConversations(parsed as Conversations);
        } else {
          setError('Dữ liệu tin nhắn đã lưu không hợp lệ.');
        }
      }
    } catch {
      setError('Không thể đọc tin nhắn đã lưu trên trình duyệt này.');
    }

    return () => { active = false; };
  }, [currentUser.id]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('vi');
    return contacts
      .filter((contact) => !term || `${contact.name} ${contact.email} ${contact.departmentName || ''}`.toLocaleLowerCase('vi').includes(term))
      .sort((a, b) => {
        const aMessages = conversations[String(a.id)] || [];
        const bMessages = conversations[String(b.id)] || [];
        const aLastMessage = aMessages[aMessages.length - 1]?.sentAt || '';
        const bLastMessage = bMessages[bMessages.length - 1]?.sentAt || '';
        return bLastMessage.localeCompare(aLastMessage) || a.name.localeCompare(b.name, 'vi');
      });
  }, [contacts, conversations, search]);

  const selectedContact = contacts.find((contact) => String(contact.id) === selectedContactId) || null;
  const activeMessages = selectedContact ? conversations[String(selectedContact.id)] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, selectedContactId]);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedContact || !text) return;

    const contactId = String(selectedContact.id);
    const nextConversations = {
      ...conversations,
      [contactId]: [
        ...(conversations[contactId] || []),
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          senderId: String(currentUser.id),
          text,
          sentAt: new Date().toISOString(),
        },
      ],
    };

    try {
      localStorage.setItem(getStorageKey(currentUser.id), JSON.stringify(nextConversations));
      setConversations(nextConversations);
      setDraft('');
      setError('');
    } catch {
      setError('Không thể lưu tin nhắn. Vui lòng kiểm tra dung lượng lưu trữ của trình duyệt.');
    }
  };

  return (
    <section className="flex h-[calc(100dvh-126px)] min-h-[520px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <aside className={`flex w-full shrink-0 flex-col border-r border-slate-100 bg-white sm:w-[300px] lg:w-[340px] ${selectedContact ? 'hidden sm:flex' : 'flex'}`}>
        <div className="border-b border-slate-100 px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Tin nhắn</h1>
              <p className="mt-1 text-xs text-slate-400">Trò chuyện cùng đồng nghiệp</p>
            </div>
            <button type="button" onClick={() => searchInputRef.current?.focus()} aria-label="Tìm người để nhắn tin" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm nhân sự"
              aria-label="Tìm kiếm cuộc trò chuyện"
              className="w-full rounded-full bg-slate-100 py-2.5 pl-9 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div role="status" className="space-y-2 p-2" aria-label="Đang tải danh bạ">
              {[1, 2, 3, 4].map((row) => <div key={row} className="h-[68px] animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />)}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-600">{search ? 'Không tìm thấy nhân sự' : 'Chưa có danh bạ'}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{search ? 'Thử tìm bằng tên hoặc email khác.' : 'Danh sách đồng nghiệp sẽ hiển thị tại đây.'}</p>
            </div>
          ) : filteredContacts.map((contact) => {
            const contactId = String(contact.id);
            const messages = conversations[contactId] || [];
            const lastMessage = messages[messages.length - 1];
            const isSelected = selectedContactId === contactId;
            return (
              <button
                type="button"
                key={contactId}
                onClick={() => setSelectedContactId(contactId)}
                aria-current={isSelected ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white">
                  {getInitials(contact.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${lastMessage ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>{contact.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{formatConversationTime(lastMessage?.sentAt)}</span>
                  </span>
                  <span className={`mt-1 block truncate text-xs ${lastMessage ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lastMessage
                      ? `${lastMessage.senderId === String(currentUser.id) ? 'Bạn: ' : ''}${lastMessage.text}`
                      : contact.departmentName || contact.email}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
          Tin nhắn được lưu trên trình duyệt này
        </div>
      </aside>

      <div className={`min-w-0 flex-1 flex-col bg-[#f7f8fa] ${selectedContact ? 'flex' : 'hidden sm:flex'}`}>
        {selectedContact ? (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
              <button type="button" onClick={() => setSelectedContactId(null)} aria-label="Quay lại danh sách tin nhắn" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:hidden">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white">
                {getInitials(selectedContact.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-slate-800">{selectedContact.name}</h2>
                <p className="truncate text-[11px] text-slate-400">{selectedContact.departmentName || selectedContact.email}</p>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-8">
              <div className="my-2 text-center">
                <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[10px] font-medium text-slate-500">
                  Bắt đầu cuộc trò chuyện với {selectedContact.name}
                </span>
              </div>
              {activeMessages.length === 0 ? (
                <div className="m-auto max-w-xs py-8 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <MessageCircle className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-slate-700">Gửi lời chào đầu tiên</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Cuộc trò chuyện riêng giữa bạn và {selectedContact.name}.</p>
                </div>
              ) : (
                <div className="mt-auto space-y-3 pt-8">
                  {activeMessages.map((message, index) => {
                    const isMine = message.senderId === String(currentUser.id);
                    const previous = index > 0 ? activeMessages[index - 1] : undefined;
                    const showSender = !previous || previous.senderId !== message.senderId;
                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[9px] font-bold text-white">
                            {showSender ? getInitials(selectedContact.name) : ''}
                          </span>
                        )}
                        <div className={`max-w-[min(78%,520px)] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-5 ${
                            isMine
                              ? 'rounded-br-md bg-blue-600 text-white'
                              : 'rounded-bl-md bg-white text-slate-800 shadow-sm'
                          }`}>{message.text}</div>
                          <div className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400 ${isMine ? 'justify-end' : ''}`}>
                            <span>{formatMessageTime(message.sentAt)}</span>
                            {isMine && <CheckCheck className="h-3 w-3 text-blue-500" aria-label="Đã gửi" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-3 sm:px-5 sm:py-4">
              <div className="flex items-end gap-2 rounded-3xl bg-slate-100 p-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  maxLength={4000}
                  aria-label="Nội dung tin nhắn"
                  placeholder="Aa"
                  className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Gửi tin nhắn"
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Nhấn Enter để gửi · Shift + Enter để xuống dòng</p>
            </form>
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center px-6 text-center sm:flex">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MessageCircle className="h-10 w-10" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-bold text-slate-800">Không gian trò chuyện</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Chọn một đồng nghiệp để bắt đầu nhắn tin riêng.</p>
          </div>
        )}
      </div>
      {error && (
        <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 shadow-lg">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Đóng thông báo" className="ml-3 font-bold underline">Đóng</button>
        </div>
      )}
    </section>
  );
};

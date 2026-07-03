"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, Loader2, User as UserIcon, MessageSquare } from "lucide-react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken, getUserInfo } from "@/lib/auth";
import { getActiveContacts, getChatHistory } from "@/utils/api";
import { cn } from "@/lib/utils";

interface Contact {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = getUserInfo();

  useEffect(() => {
    fetchContacts();
    connect();
    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchHistory(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await getActiveContacts();
      setContacts(data);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (userId: number) => {
    try {
      const data = await getChatHistory(userId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const connect = () => {
    const token = getToken();
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/user/${user.email}/queue/messages`, (msg) => {
          const newMessage = JSON.parse(msg.body);
          // Update messages if the message belongs to current conversation
          setMessages((prev) => {
             if (prev.some(m => m.id === newMessage.id)) return prev;
             return [...prev, newMessage];
          });
          // Update contact list if new contact joins
          fetchContacts();
        });
      }
    });
    client.activate();
    stompClient.current = client;
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedContact || !stompClient.current?.connected) return;

    const messageData = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: input.trim()
    };

    stompClient.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(messageData)
    });

    setInput("");
  };

  const filteredContacts = contacts.filter(c => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-card border rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar Contacts */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm người dùng..."
              className="w-full bg-muted border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-accent-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 transition-colors border-b last:border-0",
                  selectedContact?.id === contact.id ? "bg-accent-500/10 border-l-4 border-l-accent-500" : "hover:bg-muted"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center font-bold text-accent-500">
                  {contact.fullName[0].toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{contact.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/10">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-card flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center font-bold text-accent-500">
                {selectedContact.fullName[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{selectedContact.fullName}</p>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={idx} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                      isMe ? "bg-accent-500 text-white rounded-tr-none" : "bg-card border rounded-tl-none"
                    )}>
                      {msg.content}
                      <p className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                         {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Nhập nội dung tin nhắn..."
                  className="flex-1 bg-muted border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-500 outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="px-6 bg-accent-500 text-white rounded-xl font-bold hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/20 disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10" />
            </div>
            <p className="font-medium">Chọn một người dùng để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
}

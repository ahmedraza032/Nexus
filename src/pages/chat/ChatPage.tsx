import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, UserPlus, Lock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { getMessagesBetweenUsers, sendMessage, getConversationsForUser } from '../../data/messages';
import { MessageCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { getConnectionStatus } from '../../api/connectionApi';
import { ConnectionClientStatus } from '../../types';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [connStatus, setConnStatus] = useState<ConnectionClientStatus | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatPartner = async () => {
      if (!userId) {
        setChatPartner(null);
        setConnStatus(null);
        return;
      }
      try {
        const [profileRes, statusRes] = await Promise.all([
          api.get(`/profiles/${userId}`),
          getConnectionStatus(userId),
        ]);
        setChatPartner(profileRes.data);
        setConnStatus(statusRes.status);
      } catch (error) {
        console.error('Error fetching chat partner:', error);
      }
    };
    fetchChatPartner();
  }, [userId]);

  useEffect(() => {
    if (currentUser) {
      setConversations(getConversationsForUser(currentUser.id));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && userId) {
      setMessages(getMessagesBetweenUsers(currentUser.id, userId));
    }
  }, [currentUser, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    const message = sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: newMessage,
    });

    setMessages([...messages, message]);
    setNewMessage('');
    setConversations(getConversationsForUser(currentUser.id));
  };

  if (!currentUser) return null;

  // Determine if we can chat: must be accepted connection
  const isConnected = connStatus === 'accepted';
  const chatPartnerRole = chatPartner?.role;
  const profilePath = chatPartnerRole
    ? `/profile/${chatPartnerRole}/${userId}`
    : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {chatPartner ? (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Voice call">
                  <Phone size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Video call">
                  <Video size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Info">
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Not connected — show gate */}
            {!isConnected ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Connected Yet</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    You need to connect with <strong>{chatPartner.name}</strong> before you can send messages.
                  </p>
                  {profilePath && (
                    <Link to={profilePath}>
                      <Button leftIcon={<UserPlus size={16} />} className="w-full">
                        View Profile & Connect
                      </Button>
                    </Link>
                  )}
                  {connStatus === 'pending_sent' && (
                    <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      Your connection request is pending their approval.
                    </p>
                  )}
                  {connStatus === 'pending_received' && (
                    <p className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      They've sent you a connection request. Visit their profile to accept.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Messages container */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          isCurrentUser={message.senderId === currentUser.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <MessageCircle size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                      <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                    </div>
                  )}
                </div>

                {/* Message input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Button type="button" variant="ghost" size="sm" className="rounded-full p-2" aria-label="Add emoji">
                      <Smile size={20} />
                    </Button>
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      fullWidth
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newMessage.trim()}
                      className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
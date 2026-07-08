import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { MessageCircle } from 'lucide-react';
import * as messageApi from '../../api/messageApi';
import { ChatConversation } from '../../types';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchConversations = async () => {
        try {
          const convs = await messageApi.getConversations();
          setConversations(convs);
        } catch (error) {
          console.error('Error fetching conversations:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchConversations();
    }
  }, [user]);

  if (!user) return null;
  
  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex">
      {isLoading ? (
         <div className="flex-1 flex justify-center items-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
         </div>
      ) : conversations.length > 0 ? (
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 h-full">
           <ChatUserList conversations={conversations} />
        </div>
      ) : (
        <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin conversations
          </p>
        </div>
      )}
    </div>
  );
};
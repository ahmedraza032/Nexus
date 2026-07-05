import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChatConversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

interface ChatUserListItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  currentUser: any;
}

const ChatUserListItem: React.FC<ChatUserListItemProps> = ({ conversation, isActive, currentUser }) => {
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<any>(null);
  
  const otherParticipantId = conversation.participants.find(id => id !== currentUser.id);

  useEffect(() => {
    const fetchUser = async () => {
      if (!otherParticipantId) return;
      try {
        const response = await api.get(`/profiles/${otherParticipantId}`);
        setOtherUser({ ...response.data, id: response.data._id });
      } catch (error) {
        console.error('Error fetching user for conversation:', error);
      }
    };
    fetchUser();
  }, [otherParticipantId]);

  if (!otherParticipantId || !otherUser) return null;

  const handleSelectUser = () => {
    navigate(`/chat/${otherUser.id}`);
  };

  const lastMessage = conversation.lastMessage;

  return (
    <div
      className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-primary-50 border-l-4 border-primary-600'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
      onClick={handleSelectUser}
    >
      <Avatar
        src={otherUser.avatarUrl}
        alt={otherUser.name}
        size="md"
        status={otherUser.isOnline ? 'online' : 'offline'}
        className="mr-3 flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {otherUser.name}
          </h3>
          
          {lastMessage && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          {lastMessage && (
            <p className="text-xs text-gray-600 truncate">
              {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
              {lastMessage.content}
            </p>
          )}
          
          {lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id && (
            <Badge variant="primary" size="sm" rounded>New</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChatUserListProps {
  conversations: ChatConversation[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations }) => {
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  
  if (!currentUser) return null;

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>
        
        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map(conversation => (
              <ChatUserListItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeUserId === conversation.participants.find(id => id !== currentUser.id)}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
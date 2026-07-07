import React from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { useAuth } from '../../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const notifications = user?.notifications || [];
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>
        
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>
      
      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <Card
            key={notification.id || notification._id || index}
            className={`transition-colors duration-200 ${
              notification.unread ? 'bg-primary-50' : ''
            }`}
          >
            <CardBody className="flex items-start p-4">
              <Avatar
                src={notification.user.avatar}
                alt={notification.user.name}
                size="md"
                className="flex-shrink-0 mr-4"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {notification.user.name}
                  </span>
                  {notification.unread && (
                    <Badge variant="primary" size="sm" rounded>New</Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mt-1">
                  {notification.content}
                </p>
                
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {getNotificationIcon(notification.type)}
                  <span>{notification.time}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
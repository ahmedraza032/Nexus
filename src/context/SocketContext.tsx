import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, PhoneOff } from 'lucide-react';

interface IncomingCallData {
  callerId: string;
  callerName: string;
  roomId: string;
  isVideo: boolean;
}

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      // Connect to the Express server where Socket.IO is running
      const newSocket = io('http://localhost:5000');
      socketRef.current = newSocket;
      
      newSocket.on('connect', () => {
        newSocket.emit('register', user.id);
      });

      newSocket.on('incoming-call', (data: IncomingCallData) => {
        // Only show if we're not already on the call page
        if (!window.location.pathname.includes('/call/')) {
          setIncomingCall(data);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
      socketRef.current = null;
    }
  }, [user]);

  const acceptCall = () => {
    if (incomingCall) {
      navigate(`/call/${incomingCall.roomId}`, { state: { isVideo: incomingCall.isVideo } });
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('decline-call', { callerId: incomingCall.callerId });
      setIncomingCall(null);
    }
  };

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
      
      {/* Incoming Call Overlay Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center transform animate-slide-up">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              {incomingCall.isVideo ? (
                <Video size={40} className="text-blue-600" />
              ) : (
                <Phone size={40} className="text-blue-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {incomingCall.callerName}
            </h2>
            <p className="text-gray-500 mb-8 text-center">
              Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call...
            </p>
            
            <div className="flex w-full justify-between space-x-4">
              <button
                onClick={declineCall}
                className="flex-1 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <PhoneOff size={20} />
                <span>Decline</span>
              </button>
              
              <button
                onClick={acceptCall}
                className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                {incomingCall.isVideo ? <Video size={20} /> : <Phone size={20} />}
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

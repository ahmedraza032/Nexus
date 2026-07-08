import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';

// STUN servers
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

export const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const initialIsVideo = location.state?.isVideo ?? true;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!initialIsVideo);
  const [callStatus, setCallStatus] = useState<string>('Connecting...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!socket) return;
    
    // 2. Setup Media and Peer Connection
    const startCall = async () => {
      try {
        // Always get both video and audio so we can toggle later
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        // Apply initial video state
        stream.getVideoTracks().forEach(track => track.enabled = initialIsVideo);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setCallStatus('Waiting for other participant...');

        // 3. Initialize Peer Connection
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });

        // Handle incoming remote stream
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('Connected');
          }
        };

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && socket && roomId) {
            socket.emit('webrtc-ice-candidate', {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        // Join Socket Room
        socket.emit('join-call', roomId);

        // Socket Events
        socket.on('user-connected', async (userId) => {
          console.log('User connected, creating offer');
          setCallStatus('Connecting...');
          // Create offer
          if (peerConnectionRef.current) {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socket.emit('webrtc-offer', {
              roomId,
              offer,
            });
          }
        });

        socket.on('webrtc-offer', async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
          console.log('Received offer');
          setCallStatus('Connecting...');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socket.emit('webrtc-answer', {
              roomId,
              answer,
            });
          }
        });

        socket.on('webrtc-answer', async (data: { answer: RTCSessionDescriptionInit, from: string }) => {
          console.log('Received answer');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCallStatus('Connected');
          }
        });

        socket.on('webrtc-ice-candidate', async (data: { candidate: RTCIceCandidateInit, from: string }) => {
          console.log('Received ICE candidate');
          if (peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          }
        });

        socket.on('user-disconnected', () => {
          setCallStatus('Other participant left');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        socket.on('call-declined', () => {
          setCallStatus('Call Declined');
          setTimeout(() => {
            navigate(-1);
          }, 2000);
        });

      } catch (error) {
        console.error('Error accessing media devices.', error);
        setCallStatus('Error accessing camera/microphone. Please allow permissions.');
      }
    };

    startCall();

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      if (socket) {
        socket.emit('leave-call', roomId);
        socket.off('user-connected');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('user-disconnected');
        socket.off('call-declined');
      }
    };
  }, [roomId, socket, initialIsVideo, navigate]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col justify-center items-center overflow-hidden animate-fade-in">
      
      {/* Remote Video (Full Screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Local Video (Floating PIP) */}
      <div className="absolute top-6 right-6 w-48 md:w-64 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-10 hover:scale-105 transition-transform duration-300">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted // Mute local video to prevent echo
          className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <VideoOff size={32} className="mb-2" />
            <span className="text-xs font-medium">Camera Off</span>
          </div>
        )}
      </div>

      {/* Call Status Overlay */}
      {callStatus !== 'Connected' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 px-8 py-4 rounded-full text-white backdrop-blur-md z-10 shadow-lg text-lg font-medium tracking-wide">
          {callStatus}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 bg-gray-800/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl z-20 border border-gray-700">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full flex items-center justify-center transition-all duration-300 ${
            isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={endCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform hover:scale-110 duration-300"
          title="End Call"
        >
          <PhoneOff size={28} />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full flex items-center justify-center transition-all duration-300 ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isVideoOff ? "Start Video" : "Stop Video"}
        >
          {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
        </button>
      </div>
    </div>
  );
};

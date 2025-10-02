import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import TypingIndicator from './TypingIndicator';
import apiService from '../../services/api';

function ChatWindow({ courseId, courseName, user, onClose }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    console.log('🔌 Initializing socket connection...');

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Connection timeout reached');
        setError('Connection timeout - please try again');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    // Use dedicated socket URL or fallback to API URL without /api suffix
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.VITE_API_URL || 
                     'http://localhost:3001';
    console.log('🌐 Connecting to:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      console.log('🔗 Socket ID:', newSocket.id);
      console.log('🚀 Transport:', newSocket.io.engine.transport.name);
      
      setIsConnected(true);
      setError(null);
      clearTimeout(loadingTimeout);
      
      // Join course room
      console.log('📚 Joining course room:', courseId);
      newSocket.emit('join-course', courseId);
      
      // Fallback to stop loading if no recent-messages received
      setTimeout(() => {
        if (loading) {
          console.log('⚠️ No recent messages received, stopping loading');
          setLoading(false);
        }
      }, 8000);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      console.error('Error type:', error.type);
      console.error('Error message:', error.message);
      console.error('Error description:', error.description);
      
      let errorMessage = 'Failed to connect to chat server';
      
      if (error.message.includes('Invalid namespace')) {
        errorMessage = 'Server configuration error - please contact support';
      } else if (error.message.includes('xhr poll error')) {
        errorMessage = 'Network connectivity issue - check your connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - server may be down';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Authentication failed - please login again';
      }
      
      setError(errorMessage);
      setIsConnected(false);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    // Handle recent messages
    newSocket.on('recent-messages', (recentMessages) => {
      setMessages(recentMessages || []);
      setLoading(false);
      clearTimeout(loadingTimeout);
      scrollToBottom();
    });

    // Handle new messages
    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Handle typing indicators
    newSocket.on('user-typing', (userData) => {
      setTypingUsers(prev => {
        const existing = prev.find(u => u.userId === userData.userId);
        if (!existing) {
          return [...prev, userData];
        }
        return prev;
      });
    });

    newSocket.on('user-stopped-typing', (userData) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userData.userId));
    });

    // Handle user presence
    newSocket.on('user-joined', (userData) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.userId === userData.userId);
        if (!existing) {
          return [...prev, userData];
        }
        return prev;
      });
    });

    newSocket.on('user-left', (userData) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
      setTypingUsers(prev => prev.filter(u => u.userId !== userData.userId));
    });

    // Handle message reactions
    newSocket.on('message-reaction-updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });

    // Handle errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
      setLoading(false); // Stop loading on error
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(loadingTimeout);
      if (newSocket) {
        newSocket.emit('leave-course', courseId);
        newSocket.disconnect();
      }
    };
  }, [courseId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (content, type = 'text', replyTo = null) => {
    if (!socket || !isConnected) {
      setError('Not connected to chat server');
      return;
    }

    socket.emit('send-message', {
      courseId,
      content,
      type,
      replyTo
    });
  };

  const handleTypingStart = () => {
    if (!socket || !isConnected) return;
    
    socket.emit('typing-start', courseId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', courseId);
    }, 3000);
  };

  const handleTypingStop = () => {
    if (!socket || !isConnected) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit('typing-stop', courseId);
  };

  const handleReactToMessage = (messageId, reaction) => {
    if (!socket || !isConnected) return;
    
    socket.emit('react-to-message', { messageId, reaction });
  };

  const handleLoadMoreMessages = async () => {
    if (messages.length === 0) return;
    
    try {
      const oldestMessage = messages[0];
      const response = await apiService.get(`/chat/course/${courseId}/messages`, {
        before: oldestMessage.createdAt,
        limit: 20
      });
      
      if (response.messages && response.messages.length > 0) {
        setMessages(prev => [...response.messages, ...prev]);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <ChatHeader 
        courseName={courseName}
        onlineUsers={onlineUsers}
        isConnected={isConnected}
        onClose={onClose}
      />
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          currentUser={user}
          onReact={handleReactToMessage}
          onLoadMore={handleLoadMoreMessages}
        />
        
        <TypingIndicator typingUsers={typingUsers} currentUser={user} />
        
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={!isConnected}
      />
    </div>
  );
}

export default ChatWindow;
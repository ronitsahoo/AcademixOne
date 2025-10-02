import { useState, useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

function MessageList({ messages, currentUser, onReact, onLoadMore }) {
  const [showLoadMore, setShowLoadMore] = useState(true);
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      const isNearTopNow = scrollTop < 100;
      
      setIsNearTop(isNearTopNow);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoadMoreClick = async () => {
    const container = messagesContainerRef.current;
    const scrollHeightBefore = container.scrollHeight;
    
    await onLoadMore();
    
    // Maintain scroll position after loading more messages
    setTimeout(() => {
      const scrollHeightAfter = container.scrollHeight;
      const scrollDiff = scrollHeightAfter - scrollHeightBefore;
      container.scrollTop += scrollDiff;
    }, 100);
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });
    
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Load More Button */}
      {showLoadMore && messages.length > 0 && isNearTop && (
        <div className="text-center">
          <button
            onClick={handleLoadMoreClick}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            Load more messages
          </button>
        </div>
      )}

      {/* Messages grouped by date */}
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date Header */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
              {formatDateHeader(group.date)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const isConsecutive = prevMessage && 
                prevMessage.sender._id === message.sender._id &&
                (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 300000; // 5 minutes

              return (
                <MessageItem
                  key={message._id}
                  message={message}
                  currentUser={currentUser}
                  isConsecutive={isConsecutive}
                  onReact={onReact}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message!</p>
        </div>
      )}
    </div>
  );
}

export default MessageList;
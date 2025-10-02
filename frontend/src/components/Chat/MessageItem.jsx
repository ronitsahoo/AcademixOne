import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

function MessageItem({ message, currentUser, isConsecutive, onReact }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const isOwnMessage = message.sender._id === currentUser._id;
  const senderName = `${message.sender.profile?.firstName || ''} ${message.sender.profile?.lastName || ''}`.trim() || message.sender.email;
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
  const reactionMap = {
    'like': '👍',
    'love': '❤️', 
    'laugh': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡'
  };

  const handleReaction = (reactionType) => {
    const reactionKey = Object.keys(reactionMap).find(key => reactionMap[key] === reactionType);
    if (reactionKey) {
      onReact(message._id, reactionKey);
    }
    setShowReactions(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getReactionCounts = () => {
    const counts = {};
    message.reactions?.forEach(reaction => {
      const emoji = reactionMap[reaction.type];
      if (emoji) {
        counts[emoji] = (counts[emoji] || 0) + 1;
      }
    });
    return counts;
  };

  const reactionCounts = getReactionCounts();

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender name and timestamp (only show if not consecutive) */}
        {!isConsecutive && (
          <div className={`flex items-center mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {isOwnMessage ? 'You' : senderName}
            </span>
            {message.sender.role === 'teacher' && (
              <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                Instructor
              </span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : message.isAnnouncement
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            } ${isConsecutive ? 'mt-1' : 'mt-0'}`}
            onMouseEnter={() => setShowTime(true)}
            onMouseLeave={() => setShowTime(false)}
          >
            {/* Announcement indicator */}
            {message.isAnnouncement && (
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">Announcement</span>
              </div>
            )}

            {/* Reply indicator */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black bg-opacity-10 rounded text-sm">
                <div className="text-xs opacity-75">
                  Replying to {message.replyTo.sender?.profile?.firstName || message.replyTo.sender?.email}
                </div>
                <div className="truncate">
                  {message.replyTo.content}
                </div>
              </div>
            )}

            {/* Message content */}
            <div className="break-words">
              {message.content}
            </div>

            {/* Edited indicator */}
            {message.isEdited && (
              <div className="text-xs opacity-75 mt-1">
                (edited)
              </div>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <div className="absolute top-0 left-0 transform -translate-y-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex gap-1 z-10">
              {reactions.map(reaction => (
                <button
                  key={reaction}
                  onClick={() => handleReaction(reaction)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 text-lg transition-colors"
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}

          {/* Time tooltip */}
          {showTime && (
            <div className={`absolute top-0 ${isOwnMessage ? 'right-0' : 'left-0'} transform -translate-y-full bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10`}>
              {formatTime(message.createdAt)}
              {message.isEdited && (
                <div className="text-xs opacity-75">
                  Edited {formatDistanceToNow(new Date(message.editedAt))} ago
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message actions */}
      <div className={`flex items-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
          title="React"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MessageItem;
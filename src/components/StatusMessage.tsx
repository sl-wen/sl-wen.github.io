import React from 'react';

interface StatusMessageProps {
  message: string;
  onRetry?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="message-container">
      <p>{message}</p>
      {onRetry && (
        <button>重试</button>
      )}
    </div>
  );
};

export default StatusMessage;
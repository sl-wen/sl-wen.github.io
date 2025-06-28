import React from 'react';
import '../styles/StatusMessage.css';

interface StatusMessageProps {
  message: string;
  onRetry?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="messageContainer">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry}>重试</button>
      )}
    </div>
  );
};

export default StatusMessage;
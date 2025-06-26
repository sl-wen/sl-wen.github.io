import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error-container" style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--error-color)',
      backgroundColor: '#fff5f5',
      borderRadius: '8px',
      margin: '2rem auto',
      maxWidth: '600px'
    }}>
      <p style={{
        fontSize: '1.1rem',
        marginBottom: onRetry ? '1rem' : 0
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--error-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginTop: '1rem'
          }}
        >
          重试
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
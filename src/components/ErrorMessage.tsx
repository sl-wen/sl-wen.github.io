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
      <svg
        style={{
          width: '48px',
          height: '48px',
          marginBottom: '1rem',
          fill: 'currentColor'
        }}
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
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
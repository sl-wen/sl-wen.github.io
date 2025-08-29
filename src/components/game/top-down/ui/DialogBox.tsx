'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface DialogBoxProps {
  messages: Array<{ message: string; action?: string }>;
  characterName: string;
  onDone: () => void;
  gameSize: { width: number; height: number; multiplier: number };
}

const DialogBox: React.FC<DialogBoxProps> = ({
  messages,
  characterName,
  onDone,
  gameSize,
}) => {
  const { width, height, multiplier } = gameSize;
  const [currentMessage, setCurrentMessage] = useState(0);
  const [messageEnded, setMessageEnded] = useState(false);
  const [forceShowFullMessage, setForceShowFullMessage] = useState(false);

  const messageBoxHeight = Math.ceil((height / 3.5) * multiplier);

  const handleClick = useCallback(() => {
    if (messageEnded) {
      setMessageEnded(false);
      setForceShowFullMessage(false);
      if (currentMessage < messages.length - 1) {
        setCurrentMessage(currentMessage + 1);
      } else {
        setCurrentMessage(0);
        onDone();
      }
    } else {
      setMessageEnded(true);
      setForceShowFullMessage(true);
    }
  }, [currentMessage, messageEnded, messages.length, onDone]);

  useEffect(() => {
    const handleKeyPressed = (e: KeyboardEvent) => {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) {
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKeyPressed);

    return () => window.removeEventListener('keydown', handleKeyPressed);
  }, [handleClick]);

  const dialogWindowStyle = {
    imageRendering: 'pixelated' as const,
    fontFamily: '"Press Start 2P", monospace',
    textTransform: 'uppercase' as const,
    backgroundColor: '#e2b27e',
    border: 'solid',
    borderImage: `url("/assets/topdown/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
    padding: `${8 * multiplier}px`,
    position: 'absolute' as const,
    top: `${Math.ceil((height * multiplier) - (messageBoxHeight + messageBoxHeight * 0.1))}px`,
    width: `${Math.ceil(width * 0.8 * multiplier)}px`,
    left: '50%',
    transform: 'translate(-50%, 0%)',
    minHeight: `${messageBoxHeight}px`,
    zIndex: 1000,
  };

  const dialogTitleStyle = {
    fontSize: `${8 * multiplier}px`,
    marginBottom: `${6 * multiplier}px`,
    fontWeight: 'bold' as const,
    color: '#000',
  };

  const dialogFooterStyle = {
    fontSize: `${8 * multiplier}px`,
    cursor: 'pointer',
    textAlign: 'end' as const,
    position: 'absolute' as const,
    right: `${6 * multiplier}px`,
    bottom: `${6 * multiplier}px`,
    color: '#000',
  };

  return (
    <div style={dialogWindowStyle}>
      <div style={dialogTitleStyle}>
        {characterName}
      </div>
      <Message
        action={messages[currentMessage]?.action}
        message={messages[currentMessage]?.message || ''}
        key={currentMessage}
        multiplier={multiplier}
        forceShowFullMessage={forceShowFullMessage}
        onMessageEnded={() => {
          setMessageEnded(true);
        }}
      />
      <div
        onClick={handleClick}
        style={dialogFooterStyle}
      >
        {(currentMessage === messages.length - 1 && messageEnded) ? 'Ok' : 'Next'}
      </div>
    </div>
  );
};

interface MessageProps {
  action?: string;
  message: string;
  multiplier: number;
  forceShowFullMessage: boolean;
  onMessageEnded: () => void;
}

const Message: React.FC<MessageProps> = ({
  action,
  message,
  multiplier,
  forceShowFullMessage,
  onMessageEnded,
}) => {
  const [currentChar, setCurrentChar] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (forceShowFullMessage) {
      setCurrentChar(message.length);
      setIsComplete(true);
      onMessageEnded();
      return;
    }

    setCurrentChar(0);
    setIsComplete(false);

    const interval = setInterval(() => {
      setCurrentChar((prev) => {
        if (prev >= message.length) {
          setIsComplete(true);
          onMessageEnded();
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [message, forceShowFullMessage, onMessageEnded]);

  const messageStyle = {
    fontSize: `${6 * multiplier}px`,
    lineHeight: `${8 * multiplier}px`,
    color: '#000',
    minHeight: `${8 * multiplier}px`,
  };

  return (
    <div style={messageStyle}>
      {action && <span style={{ color: '#741B47' }}>{action}</span>}
      {message.substring(0, currentChar)}
      {!isComplete && <span style={{ animation: 'blink 0.5s infinite' }}>|</span>}
    </div>
  );
};

export default DialogBox;
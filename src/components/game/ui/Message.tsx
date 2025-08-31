import React, { useState, useEffect } from 'react';
import { MessageProps } from '../types/GameTypes';

export const Message: React.FC<MessageProps> = ({
  text,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (text) {
      setIsVisible(true);
      setIsTyping(true);
      setDisplayedText('');

      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < text.length) {
          setDisplayedText(text.substring(0, charIndex + 1));
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [text]);

  useEffect(() => {
    if (isVisible && !isTyping) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isTyping, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-black bg-opacity-80 border-2 border-white rounded-lg p-4 max-w-md">
        <div className="text-white text-center">
          {displayedText}
          {isTyping && (
            <span className="animate-pulse">|</span>
          )}
        </div>
      </div>
    </div>
  );
};
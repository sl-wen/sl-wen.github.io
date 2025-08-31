import React, { useState, useEffect, useRef } from 'react';
import { DialogBoxProps, DialogMessage } from '../types/GameTypes';
import { GAME_CONSTANTS } from '../constants/gameConstants';

export const DialogBox: React.FC<DialogBoxProps> = ({
  onDone,
  characterName,
  messages,
  gameSize
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentMessage = messages[currentMessageIndex];

  useEffect(() => {
    if (currentMessage) {
      startTyping();
    }
  }, [currentMessageIndex, currentMessage]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const startTyping = () => {
    setIsTyping(true);
    setIsComplete(false);
    setDisplayedText('');

    let charIndex = 0;
    const text = currentMessage.message;

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        setIsComplete(true);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      }
    }, GAME_CONSTANTS.DIALOG_SPEED);
  };

  const handleNext = () => {
    if (isTyping) {
      // 如果正在打字，直接显示完整文本
      setDisplayedText(currentMessage.message);
      setIsTyping(false);
      setIsComplete(true);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    } else if (isComplete) {
      // 如果当前消息已完成，进入下一条消息
      if (currentMessageIndex < messages.length - 1) {
        setCurrentMessageIndex(currentMessageIndex + 1);
      } else {
        // 所有消息都显示完毕
        onDone();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNext();
    }
  };

  // 计算对话框位置和尺寸
  const dialogWidth = gameSize.width * 0.8;
  const dialogHeight = 120;
  const dialogX = (gameSize.width - dialogWidth) / 2;
  const dialogY = gameSize.height - dialogHeight - 20;

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${dialogX}px`,
        top: `${dialogY}px`,
        width: `${dialogWidth}px`,
        height: `${dialogHeight}px`
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* 对话框背景 */}
      <div
        className="w-full h-full bg-black bg-opacity-80 border-2 border-white rounded-lg p-4 shadow-2xl"
        style={{
          backgroundImage: 'url(/game/assets/images/dialog_borderbox.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backdropFilter: 'blur(4px)'
        }}
      >
        {/* 角色名称 */}
        <div className="text-yellow-400 font-bold text-sm mb-2 drop-shadow-lg">
          {characterName.toUpperCase()}
        </div>

        {/* 消息内容 */}
        <div className="text-white text-base leading-relaxed mb-4 drop-shadow-md">
          {displayedText}
          {isTyping && (
            <span className="animate-pulse text-yellow-400">|</span>
          )}
        </div>

        {/* 继续提示 */}
        <div className="flex justify-end">
          <div className="text-yellow-400 text-sm animate-pulse drop-shadow-lg">
            {isComplete ? '按空格键继续...' : '按空格键跳过...'}
          </div>
        </div>
      </div>

      {/* 点击区域 */}
      <button
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onClick={handleNext}
        aria-label="Continue dialog"
      />
    </div>
  );
};
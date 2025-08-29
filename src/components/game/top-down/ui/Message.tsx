'use client';

import React, { useState, useEffect, useMemo } from 'react';

// 消息组件属性
interface MessageProps {
  message: string;
  trail?: number;
  multiplier?: number;
  onMessageEnded?: () => void;
  forceShowFullMessage?: boolean;
}

// 消息动画组件
// 移植自原项目，使用React hooks替代react-spring
const Message: React.FC<MessageProps> = ({
  message = '',
  trail = 35,
  multiplier = 1,
  onMessageEnded = () => {},
  forceShowFullMessage = false,
}) => {
  const [visibleLetters, setVisibleLetters] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // 将消息分割为字符数组
  const letters = useMemo(() => {
    return message.trim().split('').map((letter, index) => ({
      letter,
      index,
    }));
  }, [message]);

  // 动画效果
  useEffect(() => {
    if (forceShowFullMessage) {
      setVisibleLetters(letters.length);
      setIsAnimating(false);
      return;
    }

    if (letters.length === 0) {
      setVisibleLetters(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setVisibleLetters(0);

    const animateLetters = () => {
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        currentIndex++;
        setVisibleLetters(currentIndex);
        
        if (currentIndex >= letters.length) {
          clearInterval(interval);
          setIsAnimating(false);
          // 延迟调用结束回调，确保动画完成
          setTimeout(() => {
            onMessageEnded();
          }, trail);
        }
      }, trail);
    };

    animateLetters();
  }, [message, trail, forceShowFullMessage, letters.length, onMessageEnded]);

  // 消息样式
  const messageStyle = {
    fontFamily: '"Press Start 2P"',
    fontSize: `${6 * multiplier}px`,
    textTransform: 'uppercase' as const,
  };

  // 如果没有消息，不渲染
  if (!message || message.length === 0) {
    return null;
  }

  return (
    <div style={messageStyle} className="text-white">
      {forceShowFullMessage ? (
        <span>{message}</span>
      ) : (
        <span>
          {letters.map(({ letter, index }) => (
            <span
              key={index}
              style={{
                opacity: index < visibleLetters ? 1 : 0,
                transition: `opacity ${trail}ms ease-in-out`,
              }}
            >
              {letter}
            </span>
          ))}
        </span>
      )}
    </div>
  );
};

// 默认导出
export default Message;

// 导出类型
export type { MessageProps };
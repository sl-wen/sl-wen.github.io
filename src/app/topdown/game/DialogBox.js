/**
 * 游戏对话框组件
 * 
 * 用于显示游戏中的对话内容，支持：
 * - 多消息序列显示
 * - 逐字显示动画效果
 * - 键盘和鼠标交互
 * - 响应式设计，适配不同屏幕尺寸
 * - 像素风格边框和字体
 * 
 * 使用方法：
 * 1. 传入 messages 数组（包含对话消息）
 * 2. 传入 characterName 显示角色名称
 * 3. 传入 onDone 回调函数处理对话完成
 * 4. 传入 gameSize 对象以适配游戏尺寸
 * 
 * 交互方式：
 * - 点击对话框或按空格键/回车键：显示完整消息或进入下一条
 * - 按 ESC 键：跳过当前消息
 */
    
import { styled } from '@mui/material/styles';
import { useCallback, useEffect, useState } from 'react';

// 图片资源
// 注意：dialog_borderbox.png 现在从 public/game/assets/images/dialog_borderbox.png 提供

// 组件导入
import Message from './Message';

/**
 * 对话框窗口样式组件
 * 设置对话框的外观、位置和尺寸
 */
const DialogWindow = styled('div')(({ width, height, multiplier, safeBottomOffset = 0 }) => {
    // 根据游戏尺寸计算消息框高度
    const messageBoxHeight = Math.ceil((height / 3.5) * multiplier);
    const bottomOffset = Math.max(0, Number(safeBottomOffset) * multiplier);
    return {
        imageRendering: 'pixelated',  // 像素化渲染
        fontFamily: '"Press Start 2P"', // 像素风格字体
        textTransform: 'uppercase',    // 文本大写显示
        backgroundColor: '#e2b27e',    // 米色背景
        border: 'solid',
        // 使用像素风格边框图片，支持缩放
        borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
        padding: `${8 * multiplier}px`, // 内边距，支持缩放
        position: 'absolute',
        // 计算对话框位置：底部居中
        top: `${Math.ceil((height * multiplier) - (messageBoxHeight + messageBoxHeight * 0.1 + bottomOffset))}px`,
        width: `${Math.ceil(width * 0.8 * multiplier)}px`, // 宽度为游戏宽度的 80%
        left: '50%',
        transform: 'translate(-50%, 0%)', // 水平居中
        minHeight: `${messageBoxHeight}px`, // 最小高度
        touchAction: 'manipulation', // 优化触摸点击
    };
});

/**
 * 对话框标题样式组件
 * 显示角色名称
 */
const DialogTitle = styled('div')(({ multiplier }) => ({
    fontSize: `${8 * multiplier}px`,    // 字体大小，支持缩放
    marginBottom: `${6 * multiplier}px`, // 底部边距
    fontWeight: 'bold',                 // 粗体显示
}));

/**
 * 对话框底部提示样式组件
 * 显示交互提示信息
 */
const DialogFooter = styled('div')(({ multiplier }) => ({
    fontSize: `${8 * multiplier}px`,    // 字体大小，支持缩放
    cursor: 'pointer',                  // 鼠标指针样式
    textAlign: 'end',                   // 右对齐
    position: 'absolute',
    right: `${6 * multiplier}px`,       // 右侧位置
    bottom: `${6 * multiplier}px`,      // 底部位置
}));

/**
 * 对话框主组件
 * 
 * @param {Array} messages - 对话消息数组，每个元素包含 action 和 message 属性
 * @param {string} characterName - 角色名称，显示在对话框顶部
 * @param {Function} onDone - 对话完成时的回调函数
 * @param {Object} gameSize - 游戏尺寸对象，包含 width, height, multiplier
 */
const DialogBox = ({
    messages,
    characterName,
    onDone,
    gameSize,
    safeBottomOffset = 0,
}) => {
    const {
        width,      // 游戏宽度
        height,     // 游戏高度
        multiplier, // 缩放倍数
    } = gameSize;

    // 组件状态管理
    const [currentMessage, setCurrentMessage] = useState(0);           // 当前显示的消息索引
    const [messageEnded, setMessageEnded] = useState(false);          // 当前消息是否显示完成
    const [forceShowFullMessage, setForceShowFullMessage] = useState(false); // 是否强制显示完整消息

    /**
     * 处理对话框点击事件
     * 控制消息显示和切换逻辑
     */
    const handleClick = useCallback(() => {
        if (messageEnded) {
            // 当前消息已显示完成，进入下一条或结束对话
            setMessageEnded(false);
            setForceShowFullMessage(false);
            if (currentMessage < messages.length - 1) {
                // 还有下一条消息
                setCurrentMessage(currentMessage + 1);
            } else {
                // 所有消息显示完毕，重置并调用完成回调
                setCurrentMessage(0);
                onDone();
            }
        } else {
            // 当前消息未显示完成，强制显示完整内容
            setMessageEnded(true);
            setForceShowFullMessage(true);
        }
    }, [currentMessage, messageEnded, messages.length, onDone]);

    // 统一指针事件（触摸/鼠标）推进对话
    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClick();
    }, [handleClick]);

    /**
     * 设置键盘事件监听器
     * 支持键盘交互：回车键、空格键、ESC 键
     */
    useEffect(() => {
        const handleKeyPressed = (e) => {
            if (['Enter', 'Space', 'Escape'].includes(e.code)) {
                handleClick();
            }
        };
        window.addEventListener('keydown', handleKeyPressed);

        // 清理事件监听器
        return () => window.removeEventListener('keydown', handleKeyPressed);
    }, [handleClick]);

    return (
        <DialogWindow
            width={width}
            height={height}
            multiplier={multiplier}
            safeBottomOffset={safeBottomOffset}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            {/* 角色名称标题 */}
            <DialogTitle multiplier={multiplier}>
                {characterName}
            </DialogTitle>

            {/* 消息内容组件 */}
            <Message
                action={messages[currentMessage].action}
                message={messages[currentMessage].message}
                key={currentMessage}
                multiplier={multiplier}
                forceShowFullMessage={forceShowFullMessage}
                onMessageEnded={() => {
                    setMessageEnded(true);
                }}
            />

            {/* 交互提示 */}
            <DialogFooter multiplier={multiplier}>
                {messageEnded ? '结束' : '继续'}
            </DialogFooter>
        </DialogWindow>
    );
};

export default DialogBox;

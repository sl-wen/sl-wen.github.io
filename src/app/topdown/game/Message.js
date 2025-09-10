/**
 * 文本逐字显示组件 Message
 * 
 * 职责：
 * - 以“打字机”效果逐字显示一条消息
 * - 支持强制立即显示完整消息（用于点击或按键跳过）
 * - 在一条消息完整显示时通过回调通知上层（DialogBox）
 * 
 * Props：
 * - message: string 要显示的消息文本
 * - trail: number 字符显示的间隔（毫秒），默认 35ms
 * - multiplier: number UI 缩放倍数
 * - onMessageEnded: () => void 当整条消息显示完毕时触发
 * - forceShowFullMessage: boolean 是否强制直接显示完整文本
 * 
 * 使用方法：
 * <Message
 *   message="Welcome"
 *   trail={35}
 *   multiplier={1}
 *   forceShowFullMessage={false}
 *   onMessageEnded={() => {...}}
 * />
 */
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

/**
 * 对话消息容器样式组件
 * 
 * 为对话文字设置统一的像素风格样式
 * 包括字体、大小和文字转换规则
 */
const DialogMessage = styled('div')(({ multiplier }) => ({
    fontFamily: '"Press Start 2P"',      // 像素风格字体，营造复古游戏感
    fontSize: `${6 * multiplier}px`,     // 字体大小，根据缩放倍数调整
    textTransform: 'uppercase',          // 文字转为大写，增强像素游戏风格
}));

/**
 * 消息逐字显示主组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.message - 要显示的消息文本
 * @param {number} props.trail - 字符显示间隔（毫秒），控制打字机效果速度
 * @param {number} props.multiplier - UI缩放倍数，影响字体大小
 * @param {Function} props.onMessageEnded - 消息显示完成时的回调函数
 * @param {boolean} props.forceShowFullMessage - 是否强制立即显示完整消息
 * 
 * @returns {JSX.Element} 渲染的消息组件
 * 
 * 功能特点：
 * - 打字机效果：逐字符显示文本，模拟真实打字过程
 * - 可中断显示：支持强制立即显示完整文本（用于跳过动画）
 * - 动画效果：每个字符都有淡入动画，增强视觉效果
 * - 回调通知：文本完全显示后自动通知上层组件
 * - 响应式设计：根据缩放倍数调整字体大小
 */
const Message = ({
    message = [],                        // 默认空数组（兼容性处理）
    trail = 35,                         // 默认字符间隔35毫秒
    multiplier = 1,                     // 默认缩放倍数为1
    onMessageEnded = () => {},          // 默认空回调函数
    forceShowFullMessage = false,       // 默认不强制显示完整消息
}) => {
    /**
     * 当前可见字符数量状态
     * 
     * 控制打字机效果的进度，从0开始逐渐增加到消息总长度
     */
    const [visibleLetters, setVisibleLetters] = useState(0);
    
    /**
     * 消息字符数组
     * 
     * 将消息文本分割为单个字符，并为每个字符分配唯一键值
     * 使用useMemo优化性能，仅在消息内容变化时重新计算
     */
    const items = useMemo(
        () => message.trim().split('').map((letter, index) => ({
            item: letter,               // 字符内容
            key: index,                 // 唯一键值，用于React渲染
        })),
        [message]                       // 依赖消息内容
    );

    /**
     * 打字机效果控制逻辑
     * 
     * 使用useEffect管理字符显示的时间控制
     * 支持两种模式：逐字显示和立即显示
     */
    useEffect(() => {
        // 模式1：强制显示完整消息
        if (forceShowFullMessage) {
            setVisibleLetters(items.length);   // 立即显示所有字符
            return;                             // 跳过后续逻辑
        }

        // 模式2：逐字显示（打字机效果）
        if (visibleLetters < items.length) {
            // 设置定时器，在指定间隔后显示下一个字符
            const timer = setTimeout(() => {
                setVisibleLetters(prev => {
                    const next = prev + 1;     // 增加可见字符数
                    
                    // 如果所有字符都已显示，触发完成回调
                    if (next === items.length) {
                        onMessageEnded();
                    }
                    
                    return next;
                });
            }, trail);                          // 使用指定的字符间隔
            
            // 清理函数：组件卸载或依赖变化时清除定时器
            return () => clearTimeout(timer);
        }
    }, [visibleLetters, items.length, forceShowFullMessage, trail, onMessageEnded]);

    return (
        <DialogMessage multiplier={multiplier}>
            {/* 强制显示模式：直接渲染完整文本 */}
            {forceShowFullMessage && (
                <span>{message}</span>
            )}

            {/* 逐字显示模式：使用动画逐个显示字符 */}
            {!forceShowFullMessage && (
                <AnimatePresence>
                    {items.slice(0, visibleLetters).map(({ item, key }) => (
                        <motion.span
                            key={key}
                            initial={{ opacity: 0 }}        // 初始状态：完全透明
                            animate={{ opacity: 1 }}        // 动画目标：完全不透明
                            transition={{ duration: 0.1 }}  // 动画持续时间：100毫秒
                        >
                            {item}
                        </motion.span>
                    ))}
                </AnimatePresence>
            )}
        </DialogMessage>
    );
};

export default Message;

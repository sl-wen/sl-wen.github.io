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

const DialogMessage = styled('div')(({ multiplier }) => ({
    fontFamily: '"Press Start 2P"',
    fontSize: `${6 * multiplier}px`,
    textTransform: 'uppercase',
}));

const Message = ({
    message = [],
    trail = 35,
    multiplier = 1,
    onMessageEnded = () => {},
    forceShowFullMessage = false,
}) => {

    const [visibleLetters, setVisibleLetters] = useState(0);
    
    const items = useMemo(
        () => message.trim().split('').map((letter, index) => ({
            item: letter,
            key: index,
        })),
        [message]
    );

    useEffect(() => {
        if (forceShowFullMessage) {
            setVisibleLetters(items.length);
            return;
        }

        if (visibleLetters < items.length) {
            const timer = setTimeout(() => {
                setVisibleLetters(prev => {
                    const next = prev + 1;
                    if (next === items.length) {
                        onMessageEnded();
                    }
                    return next;
                });
            }, trail);
            return () => clearTimeout(timer);
        }
    }, [visibleLetters, items.length, forceShowFullMessage, trail, onMessageEnded]);

    return (
        <DialogMessage multiplier={multiplier}>
            {forceShowFullMessage && (
                <span>{message}</span>
            )}

            {!forceShowFullMessage && (
                <AnimatePresence>
                    {items.slice(0, visibleLetters).map(({ item, key }) => (
                        <motion.span
                            key={key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.1 }}
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

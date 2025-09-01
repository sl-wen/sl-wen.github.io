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

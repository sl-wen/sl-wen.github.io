import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    dialogMessage: ({ multiplier }) => ({
        fontFamily: '"Press Start 2P"',
        fontSize: `${6 * multiplier}px`,
        textTransform: 'uppercase',
    }),
}));

const Message = ({
    message = [],
    trail = 35,
    multiplier = 1,
    onMessageEnded = () => {},
    forceShowFullMessage = false,
}) => {
    const classes = useStyles({ multiplier });
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
        <div className={classes.dialogMessage}>
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
        </div>
    );
};

export default Message;

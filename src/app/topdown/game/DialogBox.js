import { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';

// Images
// Note: dialog_borderbox.png is now served from public/game/assets/images/dialog_borderbox.png

// Components
import Message from './Message';

const DialogWindow = styled('div')(({ width, height, multiplier }) => {
    const messageBoxHeight = Math.ceil((height / 3.5) * multiplier);
    return {
        imageRendering: 'pixelated',
        fontFamily: '"Press Start 2P"',
        textTransform: 'uppercase',
        backgroundColor: '#e2b27e',
        border: 'solid',
        borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
        padding: `${8 * multiplier}px`,
        position: 'absolute',
        top: `${Math.ceil((height * multiplier) - (messageBoxHeight + messageBoxHeight * 0.1))}px`,
        width: `${Math.ceil(width * 0.8 * multiplier)}px`,
        left: '50%',
        transform: 'translate(-50%, 0%)',
        minHeight: `${messageBoxHeight}px`,
    };
});

const DialogTitle = styled('div')(({ multiplier }) => ({
    fontSize: `${8 * multiplier}px`,
    marginBottom: `${6 * multiplier}px`,
    fontWeight: 'bold',
}));

const DialogFooter = styled('div')(({ multiplier }) => ({
    fontSize: `${8 * multiplier}px`,
    cursor: 'pointer',
    textAlign: 'end',
    position: 'absolute',
    right: `${6 * multiplier}px`,
    bottom: `${6 * multiplier}px`,
}));

const DialogBox = ({
    messages,
    characterName,
    onDone,
    gameSize,
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;

    const [currentMessage, setCurrentMessage] = useState(0);
    const [messageEnded, setMessageEnded] = useState(false);
    const [forceShowFullMessage, setForceShowFullMessage] = useState(false);


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
        const handleKeyPressed = (e) => {
            if (['Enter', 'Space', 'Escape'].includes(e.code)) {
                handleClick();
            }
        };
        window.addEventListener('keydown', handleKeyPressed);

        return () => window.removeEventListener('keydown', handleKeyPressed);
    }, [handleClick]);

    return (
        <DialogWindow width={width} height={height} multiplier={multiplier}>
            <DialogTitle multiplier={multiplier}>
                {characterName}
            </DialogTitle>
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
            <DialogFooter
                onClick={handleClick}
                multiplier={multiplier}
            >
                {(currentMessage === messages.length - 1 && messageEnded) ? 'Ok' : 'Next'}
            </DialogFooter>
        </DialogWindow>
    );
};

export default DialogBox;

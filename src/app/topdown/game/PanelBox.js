/**
 * PanelBox
 * 复用游戏对话框的像素风边框与字体，作为通用窗口容器（用于设置/背包等）。
 * props:
 * - open: 是否显示
 * - title: 标题
 * - onClose: 关闭回调
 * - gameSize: { width, height, multiplier }
 * - children: 内容
 */
import { styled } from '@mui/material/styles';

const Overlay = styled('div')(({ multiplier }) => ({
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    imageRendering: 'pixelated',
    fontFamily: '"Press Start 2P"',
    textTransform: 'uppercase',
}));

const PanelWindow = styled('div')(({ width, height, multiplier }) => ({
    imageRendering: 'pixelated',
    fontFamily: '"Press Start 2P"',
    textTransform: 'uppercase',
    backgroundColor: '#e2b27e',
    border: 'solid',
    borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
    padding: `${10 * multiplier}px`,
    minWidth: `${Math.ceil(width * 0.7 * multiplier)}px`,
    maxWidth: `${Math.ceil(width * 0.85 * multiplier)}px`,
    minHeight: `${Math.ceil(height * 0.35 * multiplier)}px`,
    maxHeight: `${Math.ceil(height * 0.8 * multiplier)}px`,
    overflow: 'auto',
    position: 'relative',
}));

const PanelHeader = styled('div')(({ multiplier }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: `${10 * multiplier}px`,
    marginBottom: `${8 * multiplier}px`,
    fontWeight: 'bold',
}));

const CloseButton = styled('button')(({ multiplier }) => ({
    cursor: 'pointer',
    background: '#94785c',
    color: '#fff',
    border: `${multiplier}px solid #79584f`,
    padding: `${4 * multiplier}px ${6 * multiplier}px`,
}));

const PanelBody = styled('div')(({ multiplier }) => ({
    fontSize: `${9 * multiplier}px`,
    color: '#313131',
}));

const PanelBox = ({ open, title, onClose, gameSize, children }) => {
    if (!open) return null;
    const { width, height, multiplier } = gameSize;
    return (
        <Overlay multiplier={multiplier} role="dialog" aria-modal="true">
            <PanelWindow width={width} height={height} multiplier={multiplier}>
                <PanelHeader multiplier={multiplier}>
                    <div>{title}</div>
                    <CloseButton multiplier={multiplier} onClick={onClose} aria-label="关闭">✕</CloseButton>
                </PanelHeader>
                <PanelBody multiplier={multiplier}>
                    {children}
                </PanelBody>
            </PanelWindow>
        </Overlay>
    );
};

export default PanelBox;


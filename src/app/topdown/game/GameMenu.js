/**
 * 游戏菜单组件 GameMenu
 * 
 * 职责：
 * - 接收菜单项并渲染为可选择列表
 * - 支持键盘上下选择、Enter 确认
 * - 支持鼠标 hover 高亮与点击选择
 * - 通过 `onSelected` 回调将结果传给调用方（通常是场景）
 * 
 * 使用方法：
 * - 由场景通过自定义事件下发菜单（参见 MainMenuScene / GameOverScene）：
 *   window.dispatchEvent(new CustomEvent('menu-items', { detail: { menuItems, menuPosition } }))
 * - React 层捕获后渲染 <GameMenu items position onSelected />
 */
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import classNames from 'classnames';

const MenuWrapper = styled('div')(({ multiplier, position, width, height }) => {
    const left = window.innerWidth - (width * multiplier);
    const menuWidth = 160 * multiplier;
    
    let positionStyles = {};
    if (position === 'center') {
        positionStyles = {
            minWidth: `${menuWidth}px`,
            left: '50%',
            top: `${(height * multiplier) / 2}px`,
        };
    } else if (position === 'left') {
        positionStyles = {
            minWidth: `${menuWidth}px`,
            left: `${(95 * multiplier) + left / 2}px`,
            top: `${50 * multiplier}px`,
        };
    }

    return {
        fontFamily: '"Press Start 2P"',
        fontSize: `${10 * multiplier}px`,
        textTransform: 'uppercase',
        position: 'absolute',
        transform: 'translate(-50%, 0%)',
        ...positionStyles,
    };
});

const MenuItemsWrapper = styled('ul')({
    textAlign: 'center',
    padding: 0,
});

const MenuItem = styled('li')(({ multiplier, isSelected }) => ({
    cursor: 'pointer',
    listStyle: 'none',
    padding: `${5 * multiplier}px`,
    marginBottom: `${5 * multiplier}px`,
    backgroundColor: '#94785c',
    border: `${multiplier}px solid #79584f`,
    ...(isSelected && {
        fontSize: `${11 * multiplier}px`,
        border: `${multiplier}px solid #ddd`,
    }),
}));

const GameMenu = ({
    items,
    position = 'center',
    gameSize,
    onSelected,
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;



    const [selectedItemIndex, setSelectedItemIndex] = useState(0);

    useEffect(() => {
        const handleKeyPressed = (e) => {
            switch (e.code) {
                case 'Enter': {
                    onSelected(items[selectedItemIndex]);
                    break;
                }

                case 'ArrowUp': {
                    if (selectedItemIndex > 0) {
                        setSelectedItemIndex(
                            selectedItemIndex - 1
                        );
                    }

                    break;
                }

                case 'ArrowDown': {
                    if (items.length - 1 > selectedItemIndex) {
                        setSelectedItemIndex(
                            selectedItemIndex + 1
                        );
                    }

                    break;
                }

                default: {
                    break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyPressed);

        return () => window.removeEventListener('keydown', handleKeyPressed);
    }, [items, onSelected, selectedItemIndex]);

    return (
        <MenuWrapper multiplier={multiplier} position={position} width={width} height={height}>
            <MenuItemsWrapper>
                {items.map((item, index) => (
                    <MenuItem
                        key={index}
                        multiplier={multiplier}
                        isSelected={selectedItemIndex === index}
                        onMouseEnter={() => {
                            setSelectedItemIndex(index);
                        }}
                        onClick={() => {
                            onSelected(items[selectedItemIndex]);
                        }}
                    >
                        {item}
                    </MenuItem>
                ))}
            </MenuItemsWrapper>
        </MenuWrapper>
    );
};

export default GameMenu;

/**
 * 生命值显示组件 HeroHealth
 * 
 * 职责：
 * - 显示玩家生命值的心形容器序列（full/half/empty）
 * - 与 `GameScene` 通过自定义事件保持同步
 * 
 * 使用方法：
 * <HeroHealth gameSize={{ width, height, multiplier }} healthStates={['full','half','empty']} />
 */
import { styled } from '@mui/material/styles';

// Images
// Note: health.png is now served from public/game/assets/images/health.png

const HealthContainer = styled('div')(({ multiplier, width, topOffset = 16, leftOffset = 16, heartsPerRow = 10, gap = 2 }) => {
    const left = window.innerWidth - (width * multiplier);
    return {
        imageRendering: 'pixelated',
        position: 'absolute',
        top: `${topOffset * multiplier}px`,
        left: `${(leftOffset * multiplier) + left / 2}px`,
        display: 'grid',
        gridTemplateColumns: `repeat(${heartsPerRow}, ${16 * multiplier}px)`,
        columnGap: `${gap * multiplier}px`,
        rowGap: `${gap * multiplier}px`,
    };
});

const Health = styled('div')(({ multiplier, healthState }) => ({
    width: `${16 * multiplier}px`,
    height: `${16 * multiplier}px`,
    backgroundSize: `${48 * multiplier}px ${16 * multiplier}px`,
    background: `url("/game/assets/images/health.png") no-repeat ${
        healthState === 'full' ? '0 0' :
        healthState === 'half' ? `-${16 * multiplier}px 0` :
        `-${32 * multiplier}px 0`
    }`,
}));

const HeroHealth = ({
    gameSize,
    healthStates,
    heartsPerRow = 10,
    gap = 2,
    topOffset = 16,
    leftOffset = 16,
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;



    return (
        <HealthContainer
            width={width}
            height={height}
            multiplier={multiplier}
            heartsPerRow={heartsPerRow}
            gap={gap}
            topOffset={topOffset}
            leftOffset={leftOffset}
        >
            {healthStates.map((healthState, index) => (
                <Health
                    key={index}
                    multiplier={multiplier}
                    healthState={healthState}
                />
            ))}
        </HealthContainer>
    );
};

export default HeroHealth;

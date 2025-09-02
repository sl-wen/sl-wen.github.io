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
import classNames from 'classnames';

// Images
// Note: health.png is now served from public/game/assets/images/health.png

const HealthContainer = styled('div')(({ multiplier, width }) => {
    const left = window.innerWidth - (width * multiplier);
    return {
        imageRendering: 'pixelated',
        position: 'absolute',
        top: `${16 * multiplier}px`,
        left: `${(16 * multiplier) + left / 2}px`,
        display: 'flex',
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
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;



    return (
        <HealthContainer multiplier={multiplier} width={width}>
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

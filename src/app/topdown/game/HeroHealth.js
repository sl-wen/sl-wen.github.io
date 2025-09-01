import { styled } from '@mui/material/styles';
import classNames from 'classnames';

// Images
import healthImage from './assets/images/health.png';

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
    background: `url("${healthImage}") no-repeat ${
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

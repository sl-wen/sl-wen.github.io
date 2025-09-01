import { styled } from '@mui/material/styles';
import classNames from 'classnames';

// Images
import coinImage from './assets/images/coin.png';

const CoinContainer = styled('div')(({ multiplier, width }) => {
    const left = window.innerWidth - (width * multiplier);
    return {
        fontFamily: '"Press Start 2P"',
        fontSize: `${12 * multiplier}px`,
        textTransform: 'uppercase',
        imageRendering: 'pixelated',
        position: 'absolute',
        top: `${32 * multiplier}px`,
        left: `${(16 * multiplier) + left / 2}px`,
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
    };
});

const Coin = styled('div')(({ multiplier }) => ({
    backgroundSize: `${16 * multiplier}px ${16 * multiplier}px`,
    background: `url("${coinImage}") no-repeat 0 0`,
    width: `${16 * multiplier}px`,
    height: `${16 * multiplier}px`,
}));

const CoinText = styled('span')(({ multiplier, isFull }) => {
    const strokeSize = multiplier;
    return {
        fontSize: isFull ? `${11 * multiplier}px` : `${12 * multiplier}px`,
        textShadow: isFull ? `-${strokeSize}px 0 #FFFFFF, 0 ${strokeSize}px #FFFFFF, ${strokeSize}px 0 #FFFFFF, 0 -${strokeSize}px #FFFFFF` : 'none',
        color: isFull ? '#119923' : 'inherit',
    };
});

const HeroCoin = ({
    gameSize,
    heroCoins,
}) => {
    const {
        width,
        height,
        multiplier,
    } = gameSize;



    return (
        <CoinContainer multiplier={multiplier} width={width}>
            <Coin multiplier={multiplier} />
            <CoinText
                multiplier={multiplier}
                isFull={heroCoins >= 999}
            >
                {heroCoins.toString().padStart(3, '0')}
            </CoinText>
        </CoinContainer>
    );
};

export default HeroCoin;

/**
 * 金币显示组件 CatCoin
 * 
 * 职责：
 * - 在屏幕左上区域显示玩家当前金币数量
 * - 当金币达到上限（999）时使用不同样式高亮
 * 
 * 使用方法：
 * <CatCoin gameSize={{ width, height, multiplier }} catCoins={coin} />
 */
import { styled } from '@mui/material/styles';

// Images
// Note: coin.png is now served from public/game/assets/images/coin.png

/**
 * 金币容器样式组件
 * 
 * 创建金币显示区域的容器，包含金币图标和数量文字
 * 位置固定在游戏画面的左上角区域
 */
const CoinContainer = styled('div')(({ multiplier, width }) => {
    // 计算容器的左侧位置，基于游戏画面宽度和窗口宽度
    const left = window.innerWidth - (width * multiplier);
    
    return {
        fontFamily: '"Press Start 2P"',          // 像素风格字体
        fontSize: `${12 * multiplier}px`,        // 字体大小，根据缩放倍数调整
        textTransform: 'uppercase',              // 文字转为大写
        imageRendering: 'pixelated',             // 像素化渲染，保持清晰
        position: 'absolute',                    // 绝对定位
        top: `${32 * multiplier}px`,             // 距离顶部的位置
        left: `${(16 * multiplier) + left / 2}px`, // 距离左侧的位置
        display: 'flex',                         // 弹性布局，图标和文字水平排列
        cursor: 'default',                       // 默认光标样式
        userSelect: 'none',                      // 禁止文字选择
    };
});

/**
 * 金币图标样式组件
 * 
 * 显示金币图标，使用背景图片方式加载
 * 尺寸根据缩放倍数动态调整
 */
const Coin = styled('div')(({ multiplier }) => ({
    backgroundSize: `${16 * multiplier}px ${16 * multiplier}px`, // 背景图片尺寸
    background: `url("/game/assets/images/coin.png") no-repeat 0 0`, // 金币图片，无重复，左上角对齐
    width: `${16 * multiplier}px`,               // 图标宽度
    height: `${16 * multiplier}px`,              // 图标高度
}));

/**
 * 金币数量文字样式组件
 * 
 * 显示金币数量，支持满额状态的特殊样式
 * 当金币达到上限（999）时会有高亮效果
 */
const CoinText = styled('span')(({ multiplier, isFull }) => {
    const strokeSize = multiplier; // 文字描边大小
    
    return {
        // 满额时字体稍小，普通状态使用标准大小
        fontSize: isFull ? `${11 * multiplier}px` : `${12 * multiplier}px`,
        
        // 满额时添加白色描边效果，创造高亮感
        textShadow: isFull 
            ? `-${strokeSize}px 0 #FFFFFF, 0 ${strokeSize}px #FFFFFF, ${strokeSize}px 0 #FFFFFF, 0 -${strokeSize}px #FFFFFF` 
            : 'none',
        
        // 满额时使用绿色，普通状态继承父级颜色
        color: isFull ? '#119923' : 'inherit',
    };
});

/**
 * 金币显示主组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.gameSize - 游戏尺寸对象
 * @param {number} props.gameSize.width - 游戏画面宽度
 * @param {number} props.gameSize.multiplier - 游戏缩放倍数
 * @param {number} props.catCoins - 当前金币数量
 * 
 * @returns {JSX.Element} 渲染的金币显示组件
 * 
 * 使用示例：
 * <CatCoin 
 *   gameSize={{ width: 480, multiplier: 2 }} 
 *   catCoins={123} 
 * />
 * 
 * 功能特点：
 * - 显示三位数格式的金币数量（如：001, 023, 999）
 * - 当金币达到999时自动应用满额高亮效果
 * - 响应式设计，根据游戏缩放倍数调整大小
 * - 像素风格设计，与游戏整体风格一致
 */
const CatCoin = ({
    gameSize,
    catCoins,
}) => {
    // 从游戏尺寸对象中提取所需属性
    const {
        width,        // 游戏画面宽度，用于计算容器位置
        multiplier,   // 缩放倍数，用于调整所有元素尺寸
    } = gameSize;

    return (
        // 金币显示容器，包含图标和数量文字
        <CoinContainer multiplier={multiplier} width={width}>
            {/* 金币图标 */}
            <Coin multiplier={multiplier} />
            
            {/* 金币数量文字 */}
            <CoinText
                multiplier={multiplier}
                isFull={catCoins >= 999}  // 判断是否达到满额状态（999金币）
            >
                {/* 
                 * 格式化金币数量显示
                 * - 转换为字符串
                 * - 使用padStart确保显示为3位数格式（前面补0）
                 * - 例：5 -> "005", 23 -> "023", 999 -> "999"
                 */}
                {catCoins.toString().padStart(3, '0')}
            </CoinText>
        </CoinContainer>
    );
};

export default CatCoin;

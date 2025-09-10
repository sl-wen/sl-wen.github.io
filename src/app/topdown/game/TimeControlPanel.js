/**
 * TimeControlPanel - 时间控制面板
 * 
 * 提供时间倍率控制的UI界面，包括：
 * - 时间倍率选择按钮
 * - 当前时间显示
 * - 天气和季节信息
 * - 快捷键提示
 */

import React, { useState, useEffect } from 'react';
import { TIME_SPEEDS, TIME_CONTROL_KEYS } from './constants.js';

const TimeControlPanel = ({ 
    gameSize, 
    timeInfo = {}, 
    onSpeedChange,
    visible = true,
    position = 'top-right' // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) => {
    const [currentSpeed, setCurrentSpeed] = useState(TIME_SPEEDS.NORMAL);
    const [showPanel, setShowPanel] = useState(visible);

    // 时间倍率选项
    const speedOptions = [
        { key: 'PAUSED', value: TIME_SPEEDS.PAUSED, label: '⏸️', name: '暂停' },
        { key: 'SLOW', value: TIME_SPEEDS.SLOW, label: '🐌', name: '慢速' },
        { key: 'NORMAL', value: TIME_SPEEDS.NORMAL, label: '▶️', name: '正常' },
        { key: 'FAST', value: TIME_SPEEDS.FAST, label: '⏩', name: '快速' },
        { key: 'VERY_FAST', value: TIME_SPEEDS.VERY_FAST, label: '⏭️', name: '很快' },
        { key: 'ULTRA_FAST', value: TIME_SPEEDS.ULTRA_FAST, label: '🚀', name: '极快' }
    ];

    // 处理速度变化
    const handleSpeedChange = (speed) => {
        setCurrentSpeed(speed);
        if (onSpeedChange) {
            onSpeedChange(speed);
        }
    };

    // 获取天气图标
    const getWeatherIcon = (weather) => {
        const icons = {
            clear: '☀️',
            rain: '🌧️',
            wind: '💨',
            snow: '❄️'
        };
        return icons[weather] || '☀️';
    };

    // 获取季节图标
    const getSeasonIcon = (season) => {
        const icons = {
            spring: '🌸',
            summer: '☀️',
            autumn: '🍂',
            winter: '❄️'
        };
        return icons[season] || '🌸';
    };

    // 获取时间阶段图标
    const getPhaseIcon = (phase) => {
        const icons = {
            dawn: '🌅',
            morning: '🌞',
            noon: '☀️',
            afternoon: '🌤️',
            dusk: '🌇',
            night: '🌙',
            midnight: '🌌'
        };
        return icons[phase] || '🌞';
    };

    // 计算面板位置
    const getPanelStyle = () => {
        const baseStyle = {
            position: 'absolute',
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #444',
            borderRadius: '8px',
            padding: '12px',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '12px',
            minWidth: '200px',
            backdropFilter: 'blur(5px)'
        };

        const positions = {
            'top-left': { top: '10px', left: '10px' },
            'top-right': { top: '10px', right: '10px' },
            'bottom-left': { bottom: '10px', left: '10px' },
            'bottom-right': { bottom: '10px', right: '10px' }
        };

        return { ...baseStyle, ...positions[position] };
    };

    if (!showPanel) {
        return (
            <button
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '50px',
                    zIndex: 1000,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                }}
                onClick={() => setShowPanel(true)}
            >
                ⏰
            </button>
        );
    }

    return (
        <div style={getPanelStyle()}>
            {/* 标题栏 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                borderBottom: '1px solid #666',
                paddingBottom: '4px'
            }}>
                <span style={{ fontWeight: 'bold' }}>⏰ 时间控制</span>
                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onClick={() => setShowPanel(false)}
                >
                    ✕
                </button>
            </div>

            {/* 时间信息显示 */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {timeInfo.time || '--:--'}
                    </span>
                    <span>{getPhaseIcon(timeInfo.phase)}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                        第{timeInfo.day || 1}天
                    </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                    <span>
                        {getSeasonIcon(timeInfo.season)} {timeInfo.season || 'spring'}
                    </span>
                    <span>
                        {getWeatherIcon(timeInfo.weather)} {timeInfo.weather || 'clear'}
                    </span>
                </div>
            </div>

            {/* 速度控制按钮 */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', marginBottom: '4px', opacity: 0.8 }}>
                    时间倍率: {currentSpeed}x
                </div>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '4px' 
                }}>
                    {speedOptions.map((option) => (
                        <button
                            key={option.key}
                            style={{
                                backgroundColor: currentSpeed === option.value ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                                color: currentSpeed === option.value ? '#000' : '#fff',
                                border: '1px solid #666',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => handleSpeedChange(option.value)}
                            title={`${option.name} (${option.value}x)`}
                        >
                            <span style={{ fontSize: '12px' }}>{option.label}</span>
                            <span style={{ fontSize: '8px' }}>{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 高级控制按钮 */}
            <div style={{ 
                display: 'flex', 
                gap: '4px', 
                marginBottom: '8px',
                borderTop: '1px solid #666',
                paddingTop: '8px'
            }}>
                <button
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '4px',
                        padding: '4px',
                        fontSize: '9px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        // 跳转到特定时间
                        try {
                            const evt = new CustomEvent('time-jump', { detail: { hour: 6, minute: 0 } });
                            window.dispatchEvent(evt);
                        } catch (e) {}
                    }}
                    title="跳转到早上6点"
                >
                    🌅 早晨
                </button>
                
                <button
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '4px',
                        padding: '4px',
                        fontSize: '9px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        try {
                            const evt = new CustomEvent('time-jump', { detail: { hour: 12, minute: 0 } });
                            window.dispatchEvent(evt);
                        } catch (e) {}
                    }}
                    title="跳转到中午12点"
                >
                    ☀️ 正午
                </button>
                
                <button
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '4px',
                        padding: '4px',
                        fontSize: '9px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        try {
                            const evt = new CustomEvent('time-jump', { detail: { hour: 20, minute: 0 } });
                            window.dispatchEvent(evt);
                        } catch (e) {}
                    }}
                    title="跳转到晚上8点"
                >
                    🌙 夜晚
                </button>
            </div>

            {/* 快捷键提示 */}
            <div style={{ 
                fontSize: '9px', 
                opacity: 0.6, 
                borderTop: '1px solid #666',
                paddingTop: '4px'
            }}>
                快捷键: 0-5数字键控制时间倍率<br/>
                点击上方按钮快速跳转时间
            </div>
        </div>
    );
};

export default TimeControlPanel;
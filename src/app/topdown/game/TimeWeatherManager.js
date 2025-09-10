/**
 * TimeWeatherManager
 * - 管理昼夜与天气（晴/雨/风 可扩展）
 * - 可配置时间倍率；每帧推进并广播给 UI
 * - 支持更精细的时间控制和季节变化
 */
export default class TimeWeatherManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {{minutePerSecond?:number, startHour?:number, startDay?:number, startSeason?:string}} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // 时间系统
        this.minutesPerRealSecond = options.minutePerSecond || 1;
        this.timeOfDayMin = (options.startHour ?? 8) * 60; // 以分钟记录 0..1439
        this.dayCount = options.startDay ?? 1;
        this.season = options.startSeason ?? 'spring'; // 'spring' | 'summer' | 'autumn' | 'winter'
        
        // 天气系统
        this.weather = 'clear'; // 'clear' | 'rain' | 'wind' | 'snow'
        this.weatherTimeLeftMs = 0;
        this.weatherIntensity = 0.5; // 0.0 - 1.0 天气强度
        
        // 广播系统
        this.lastBroadcastMs = 0;
        this.broadcastInterval = 500; // 广播间隔（毫秒）
        
        // 时间倍率预设
        this.speedPresets = {
            'paused': 0,
            'slow': 0.5,
            'normal': 1,
            'fast': 3,
            'very-fast': 6,
            'ultra-fast': 12
        };
        
        // 昼夜循环配置
        this.dayPhases = {
            dawn: { start: 5 * 60, end: 7 * 60 },      // 5:00-7:00 黎明
            morning: { start: 7 * 60, end: 12 * 60 },   // 7:00-12:00 上午
            noon: { start: 12 * 60, end: 14 * 60 },     // 12:00-14:00 正午
            afternoon: { start: 14 * 60, end: 18 * 60 }, // 14:00-18:00 下午
            dusk: { start: 18 * 60, end: 20 * 60 },     // 18:00-20:00 黄昏
            night: { start: 20 * 60, end: 24 * 60 },    // 20:00-24:00 夜晚
            midnight: { start: 0, end: 5 * 60 }         // 0:00-5:00 深夜
        };
    }

    /**
     * 设置时间倍率
     * @param {string|number} preset 预设名或自定义倍率
     */
    setSpeed(preset) {
        if (typeof preset === 'string' && this.speedPresets[preset] !== undefined) {
            this.minutesPerRealSecond = this.speedPresets[preset];
        } else if (typeof preset === 'number' && preset >= 0) {
            this.minutesPerRealSecond = preset;
        } else {
            this.minutesPerRealSecond = 1; // 默认正常速度
        }
    }

    /**
     * 获取当前时间倍率
     */
    getSpeed() {
        return this.minutesPerRealSecond;
    }

    /**
     * 获取当前时间阶段
     */
    getCurrentPhase() {
        const m = this.timeOfDayMin;
        for (const [phase, { start, end }] of Object.entries(this.dayPhases)) {
            if ((start <= end && m >= start && m < end) || 
                (start > end && (m >= start || m < end))) {
                return phase;
            }
        }
        return 'unknown';
    }

    /**
     * 获取季节信息
     */
    getSeason() {
        // 根据天数计算季节（每30天一季）
        const seasonIndex = Math.floor((this.dayCount - 1) / 30) % 4;
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        return seasons[seasonIndex];
    }

    /**
     * 根据时间计算夜幕强度（0..0.8）
     */
    getNightAlpha() {
        // 返回0，完全禁用夜晚覆盖层
        return 0.0;
    }

    /**
     * 获取环境光颜色
     */
    getAmbientColor() {
        // 返回纯白色，不受时间和季节影响
        return { r: 255, g: 255, b: 255 };
    }

    /**
     * 获取格式化的时间字符串
     * @param {boolean} includePhase 是否包含时间阶段
     */
    getTimeString(includePhase = false) {
        const h = Math.floor(this.timeOfDayMin / 60) % 24;
        const mm = Math.floor(this.timeOfDayMin % 60);
        const hhStr = String(h).padStart(2, '0');
        const mmStr = String(mm).padStart(2, '0');
        
        const timeStr = `${hhStr}:${mmStr}`;
        
        if (includePhase) {
            const phase = this.getCurrentPhase();
            const phaseNames = {
                dawn: '黎明',
                morning: '上午',
                noon: '正午',
                afternoon: '下午',
                dusk: '黄昏',
                night: '夜晚',
                midnight: '深夜'
            };
            return `${timeStr} (${phaseNames[phase] || phase})`;
        }
        
        return timeStr;
    }

    /**
     * 获取详细的时间信息
     */
    getTimeInfo() {
        return {
            time: this.getTimeString(),
            timeWithPhase: this.getTimeString(true),
            day: this.dayCount,
            season: this.getSeason(),
            phase: this.getCurrentPhase(),
            speedMultiplier: this.minutesPerRealSecond,
            weather: this.weather,
            weatherIntensity: this.weatherIntensity,
            nightAlpha: this.getNightAlpha(),
            ambientColor: this.getAmbientColor()
        };
    }

    /**
     * 天气系统更新
     */
    maybeRollWeather() {
        if (this.weatherTimeLeftMs > 0) return;
        
        const season = this.getSeason();
        const phase = this.getCurrentPhase();
        
        // 季节和时间影响天气概率
        const weatherProbabilities = this.getWeatherProbabilities(season, phase);
        const r = Math.random();
        let cumulativeProbability = 0;
        
        for (const [weatherType, probability] of Object.entries(weatherProbabilities)) {
            cumulativeProbability += probability;
            if (r < cumulativeProbability) {
                this.weather = weatherType;
                this.weatherIntensity = 0.3 + Math.random() * 0.7; // 0.3-1.0
                this.weatherTimeLeftMs = this.getWeatherDuration(weatherType, season);
                break;
            }
        }
    }

    /**
     * 获取天气概率（基于季节和时间）
     */
    getWeatherProbabilities(season, phase) {
        const baseProbabilities = {
            clear: 0.6,
            rain: 0.25,
            wind: 0.1,
            snow: 0.05
        };
        
        // 季节调整
        const seasonModifiers = {
            spring: { clear: 0.5, rain: 0.35, wind: 0.15, snow: 0.0 },
            summer: { clear: 0.7, rain: 0.15, wind: 0.1, snow: 0.0 },
            autumn: { clear: 0.4, rain: 0.3, wind: 0.25, snow: 0.05 },
            winter: { clear: 0.3, rain: 0.1, wind: 0.2, snow: 0.4 }
        };
        
        // 时间调整（夜晚更容易下雨）
        const timeModifiers = {
            dawn: { rain: 1.2 },
            morning: { clear: 1.1 },
            noon: { clear: 1.2 },
            afternoon: { clear: 1.0 },
            dusk: { rain: 1.1, wind: 1.1 },
            night: { rain: 1.3, wind: 1.2 },
            midnight: { rain: 1.4, wind: 1.3 }
        };
        
        const seasonData = seasonModifiers[season] || seasonModifiers.spring;
        const timeData = timeModifiers[phase] || {};
        
        const result = {};
        for (const [weather, baseProb] of Object.entries(baseProbabilities)) {
            let prob = seasonData[weather] || baseProb;
            prob *= (timeData[weather] || 1.0);
            result[weather] = prob;
        }
        
        // 归一化概率
        const total = Object.values(result).reduce((sum, p) => sum + p, 0);
        for (const weather in result) {
            result[weather] /= total;
        }
        
        return result;
    }

    /**
     * 获取天气持续时间
     */
    getWeatherDuration(weatherType, season) {
        const baseDurations = {
            clear: [300, 600], // 5-10分钟
            rain: [120, 300],  // 2-5分钟
            wind: [60, 180],   // 1-3分钟
            snow: [180, 420]   // 3-7分钟
        };
        
        const [min, max] = baseDurations[weatherType] || baseDurations.clear;
        const duration = min + Math.random() * (max - min);
        
        // 季节调整（冬天天气持续更久）
        const seasonMultiplier = season === 'winter' ? 1.5 : 
                               season === 'autumn' ? 1.2 : 1.0;
        
        return Math.floor(duration * seasonMultiplier * 1000);
    }

    /**
     * 主更新方法
     * @param {number} deltaMs 帧间隔时间（毫秒）
     */
    update(deltaMs) {
        // 如果时间暂停，跳过时间推进但继续处理广播
        if (this.minutesPerRealSecond > 0) {
            // 推进游戏时间
            const deltaMinutes = (deltaMs / 1000) * this.minutesPerRealSecond;
            this.timeOfDayMin += deltaMinutes;
            
            // 处理日期变更
            while (this.timeOfDayMin >= 1440) {
                this.timeOfDayMin -= 1440;
                this.dayCount += 1;
                this.onNewDay();
            }
            
            // 处理负时间（理论上不应该发生）
            while (this.timeOfDayMin < 0) {
                this.timeOfDayMin += 1440;
                this.dayCount = Math.max(1, this.dayCount - 1);
            }

            // 天气系统更新
            if (this.weatherTimeLeftMs <= 0) {
                this.maybeRollWeather();
            } else {
                this.weatherTimeLeftMs -= deltaMs;
            }
        }

        // 广播系统（即使时间暂停也要广播当前状态）
        this.lastBroadcastMs += deltaMs;
        if (this.lastBroadcastMs >= this.broadcastInterval) {
            this.lastBroadcastMs = 0;
            this.broadcastTimeWeather();
        }
    }

    /**
     * 新的一天事件处理
     */
    onNewDay() {
        // 可以在这里处理每日事件
        console.log(`新的一天开始：第${this.dayCount}天，${this.getSeason()}`);
        
        // 重置天气（可选）
        this.weatherTimeLeftMs = 0;
        
        // 发送新一天事件
        try {
            const evt = new CustomEvent('new-day', {
                detail: {
                    day: this.dayCount,
                    season: this.getSeason()
                }
            });
            window.dispatchEvent(evt);
        } catch (_) {}
    }

    /**
     * 广播时间天气信息给UI
     */
    broadcastTimeWeather() {
        try {
            const timeInfo = this.getTimeInfo();
            const evt = new CustomEvent('time-weather', {
                detail: timeInfo
            });
            window.dispatchEvent(evt);
        } catch (_) {}
    }

    /**
     * 跳转到指定时间
     * @param {number} hour 小时 (0-23)
     * @param {number} minute 分钟 (0-59)
     */
    setTime(hour, minute = 0) {
        this.timeOfDayMin = (hour % 24) * 60 + (minute % 60);
    }

    /**
     * 增加指定的游戏时间
     * @param {number} minutes 要增加的分钟数
     */
    addTime(minutes) {
        this.timeOfDayMin += minutes;
        while (this.timeOfDayMin >= 1440) {
            this.timeOfDayMin -= 1440;
            this.dayCount += 1;
            this.onNewDay();
        }
    }

    /**
     * 强制设置天气
     * @param {string} weatherType 天气类型
     * @param {number} durationMs 持续时间（毫秒）
     * @param {number} intensity 强度 (0-1)
     */
    setWeather(weatherType, durationMs = 300000, intensity = 0.5) {
        this.weather = weatherType;
        this.weatherTimeLeftMs = durationMs;
        this.weatherIntensity = Math.max(0, Math.min(1, intensity));
    }
}


/**
 * TimeWeatherManager
 * - 管理昼夜与天气（晴/雨/风 可扩展）
 * - 可配置时间倍率；每帧推进并广播给 UI
 */
export default class TimeWeatherManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {{minutePerSecond?:number, startHour?:number}} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        // 1 实时秒 = x 游戏分钟（默认：1s=1min）
        this.minutesPerRealSecond = options.minutePerSecond || 1;
        this.timeOfDayMin = (options.startHour ?? 8) * 60; // 以分钟记录 0..1439
        this.dayCount = 1;
        this.weather = 'clear'; // 'clear' | 'rain' | 'wind'
        this.weatherTimeLeftMs = 0;
        this.lastBroadcastMs = 0;
    }

    setSpeed(preset) {
        // 'slow'|'normal'|'fast'
        if (preset === 'slow') this.minutesPerRealSecond = 0.5;
        else if (preset === 'fast') this.minutesPerRealSecond = 3;
        else this.minutesPerRealSecond = 1; // normal
    }

    /**
     * 根据时间计算夜幕强度（0..0.6）
     */
    getNightAlpha() {
        const m = this.timeOfDayMin;
        // 简化：20:00-4:00 最暗，日出/日落过渡
        const nightStart = 20 * 60;
        const nightEnd = 4 * 60;
        const maxAlpha = 0.6;
        if (m >= nightStart || m < nightEnd) return maxAlpha;
        // 日落 18:00-20:00 过渡，日出 4:00-6:00 过渡
        if (m >= 18 * 60 && m < nightStart) {
            const t = (m - 18 * 60) / (2 * 60);
            return t * maxAlpha;
        }
        if (m >= nightEnd && m < 6 * 60) {
            const t = 1 - (m - nightEnd) / (2 * 60);
            return Math.max(0, t * maxAlpha);
        }
        return 0;
    }

    getTimeString() {
        const h = Math.floor(this.timeOfDayMin / 60) % 24;
        const mm = this.timeOfDayMin % 60;
        const hhStr = String(h).padStart(2, '0');
        const mmStr = String(mm).padStart(2, '0');
        return `${hhStr}:${mmStr}`;
    }

    maybeRollWeather() {
        if (this.weatherTimeLeftMs > 0) return;
        // 简单随机：70% 晴，25% 小雨，5% 大风（预留）
        const r = Math.random();
        if (r < 0.25) {
            this.weather = 'rain';
            // 2-4 分钟的雨
            this.weatherTimeLeftMs = (120 + Math.floor(Math.random() * 120)) * 1000;
        } else if (r < 0.30) {
            this.weather = 'wind';
            this.weatherTimeLeftMs = (60 + Math.floor(Math.random() * 60)) * 1000;
        } else {
            this.weather = 'clear';
            this.weatherTimeLeftMs = (180 + Math.floor(Math.random() * 180)) * 1000;
        }
    }

    update(deltaMs) {
        // 推进游戏时间
        const deltaMinutes = (deltaMs / 1000) * this.minutesPerRealSecond;
        this.timeOfDayMin += deltaMinutes;
        if (this.timeOfDayMin >= 1440) {
            this.timeOfDayMin -= 1440;
            this.dayCount += 1;
        }

        // 天气
        if (this.weatherTimeLeftMs <= 0) this.maybeRollWeather();
        else this.weatherTimeLeftMs -= deltaMs;

        // 每 500ms 广播一次给 UI
        this.lastBroadcastMs += deltaMs;
        if (this.lastBroadcastMs >= 500) {
            this.lastBroadcastMs = 0;
            try {
                const evt = new CustomEvent('time-weather', {
                    detail: {
                        time: this.getTimeString(),
                        day: this.dayCount,
                        weather: this.weather,
                    },
                });
                window.dispatchEvent(evt);
            } catch (_) {}
        }
    }
}


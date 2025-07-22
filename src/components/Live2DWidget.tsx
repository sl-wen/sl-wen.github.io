"use client";
import { useEffect } from "react";

export default function Live2DWidget() {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js";
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (typeof (window as any).L2Dwidget !== "undefined") {
                (window as any).L2Dwidget.init({
                    model: {
                        jsonPath: "https://cdn.jsdelivr.net/npm/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json",
                        scale: 1.1,
                        motionPreload: "all",
                        motionInterval: 6000,
                        motionRandom: true,
                    },
                    display: {
                        position: "right",
                        width: 200,
                        height: 320,
                        hOffset: 0,
                        vOffset: -20,
                        draggable: true,
                    },
                    mobile: {
                        show: true,
                        scale: 0.8,
                    },
                    react: {
                        opacityDefault: 0.8,
                        opacityOnHover: 1,
                    },
                });
                waitForLive2D();
            }
        };

        // 等待Live2D元素加载
        function waitForLive2D() {
            let checkInterval = setInterval(function () {
                try {
                    const live2dContainer = document.getElementById('live2d-widget');
                    const canvas = document.querySelector('#live2d-widget canvas');
                    if (live2dContainer && canvas) {
                        clearInterval(checkInterval);
                        setupLive2DInteractions(live2dContainer, canvas);
                    }
                } catch (error) {
                    clearInterval(checkInterval);
                }
            }, 1000);
            setTimeout(function () {
                try {
                    clearInterval(checkInterval);
                    const live2dContainer = document.getElementById('live2d-widget');
                    const canvas = document.querySelector('#live2d-widget canvas');
                    if (live2dContainer && canvas) {
                        setupLive2DInteractions(live2dContainer, canvas);
                    }
                } catch (error) { }
            }, 5000);
        }

        // 设置Live2D交互功能
        function setupLive2DInteractions(container: HTMLElement, canvas: Element) {
            container.style.position = 'fixed';
            container.style.zIndex = '999';
            (canvas as HTMLElement).style.pointerEvents = 'auto';
            // 创建消息框
            let messageBox = document.createElement('div');
            messageBox.id = 'live2d-custom-message';
            messageBox.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        color: #333;
        padding: 8px 15px;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.5s;
        pointer-events: none;
        max-width: 200px;
        z-index: 1000;
        white-space: nowrap;
      `;
            container.appendChild(messageBox);
            const greetings = [
                '你好呀！欢迎来到我的网站~',
                '今天天气真不错！',
                '摸我干嘛(*/ω＼*)',
                '别戳我啦，好痒！',
                '你想知道什么呢？',
                '我是可爱的你的助手~',
                '有什么可以帮到你吗？',
                '今天也要元气满满哦！',
                '摸头杀！啊啊啊~',
                '主人，你又来啦~'
            ];
            let isShowingMessage = false;
            let isDragging = false;
            let messageTimeout: any = null;
            let hideTimeout: any = null;
            function showMessage(text: string, duration = 2000) {
                if (isShowingMessage || isDragging) return;
                isShowingMessage = true;
                messageBox.textContent = text;
                messageBox.style.opacity = '1';
                clearTimeout(messageTimeout);
                clearTimeout(hideTimeout);
                messageTimeout = setTimeout(() => {
                    messageBox.style.opacity = '0';
                    hideTimeout = setTimeout(() => {
                        isShowingMessage = false;
                    }, 1000);
                }, duration);
            }
            function getRandomGreeting() {
                return greetings[Math.floor(Math.random() * greetings.length)];
            }
            let isTouching = false;
            let startX = 0, startY = 0, startRight = 0, startBottom = 0, hasMoved = false, touchStartTime = 0;
            function handleTouchStart(e: any) {
                const point = e.touches ? e.touches[0] : e;
                const rect = container.getBoundingClientRect();
                if (point.clientX >= rect.left && point.clientX <= rect.right &&
                    point.clientY >= rect.top && point.clientY <= rect.bottom) {
                    isTouching = true;
                    hasMoved = false;
                    touchStartTime = Date.now();
                    startX = point.clientX;
                    startY = point.clientY;
                    const styles = getComputedStyle(container);
                    startRight = parseInt(styles.right, 10) || 0;
                    startBottom = parseInt(styles.bottom, 10) || 0;
                    e.preventDefault();
                }
            }
            function handleTouchMove(e: any) {
                if (!isTouching) return;
                const point = e.touches ? e.touches[0] : e;
                const dx = point.clientX - startX;
                const dy = point.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    hasMoved = true;
                    isDragging = true;
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;
                    const containerRect = container.getBoundingClientRect();
                    const maxRight = windowWidth - containerRect.width;
                    const maxBottom = windowHeight - containerRect.height;
                    const newRight = Math.min(maxRight, Math.max(0, startRight - dx));
                    const newBottom = Math.min(maxBottom, Math.max(0, startBottom - dy));
                    container.style.right = newRight + 'px';
                    container.style.bottom = newBottom + 'px';
                    e.preventDefault();
                }
            }
            function handleTouchEnd(e: any) {
                if (!isTouching) return;
                const touchDuration = Date.now() - touchStartTime;
                if (!hasMoved && touchDuration < 300 && !isShowingMessage) {
                    if ((e.type === 'touchend' && !e._handled) ||
                        (e.type === 'mouseup' && !e.touches && !e._handled)) {
                        e._handled = true;
                        showMessage(getRandomGreeting());
                        e.preventDefault();
                    }
                }
                isTouching = false;
                isDragging = false;
            }
            document.addEventListener('touchstart', handleTouchStart, { passive: false });
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd, { passive: false });
            container.addEventListener('mousedown', handleTouchStart);
            document.addEventListener('mousemove', handleTouchMove);
            document.addEventListener('mouseup', handleTouchEnd);
            showMessage('你好！我是你的小助手~');
            setInterval(() => {
                if (Math.random() < 0.3) {
                    showMessage(getRandomGreeting());
                }
            }, 30000);
        }

        return () => {
            script.remove();
            const live2d = document.getElementById("live2d-widget");
            if (live2d) live2d.remove();
            const msg = document.getElementById("live2d-custom-message");
            if (msg) msg.remove();
        };
    }, []);

    return null;
} 
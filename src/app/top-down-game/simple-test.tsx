'use client';

import { useEffect, useState } from 'react';

export default function SimpleGameTest() {
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const addTestResult = (result: string) => {
        console.log(`[SimpleTest] ${result}`);
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
    };

    useEffect(() => {
        addTestResult('开始简单测试');

        const runTests = async () => {
            try {
                // 测试1: 检查Phaser
                addTestResult('测试1: 检查Phaser库');
                const Phaser = await import('phaser');
                addTestResult(`✓ Phaser版本: ${Phaser.VERSION}`);

                // 测试2: 检查GridEngine
                addTestResult('测试2: 检查GridEngine库');
                const GridEngine = await import('grid-engine');
                addTestResult('✓ GridEngine加载成功');

                // 测试3: 创建简单Phaser游戏
                addTestResult('测试3: 创建简单Phaser游戏');
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    const config = {
                        type: Phaser.AUTO,
                        width: 400,
                        height: 300,
                        parent: gameContainer,
                        backgroundColor: '#000000',
                        scene: {
                            create: function (this: any) {
                                addTestResult('✓ Phaser游戏场景创建成功');
                                this.add.text(200, 150, '游戏测试成功！', {
                                    fontSize: '24px',
                                    color: '#ffffff'
                                }).setOrigin(0.5);
                            }
                        }
                    };

                    const game = new Phaser.Game(config);
                    addTestResult('✓ Phaser游戏实例创建成功');
                }

                addTestResult('所有测试完成');
                setIsLoading(false);

            } catch (error) {
                addTestResult(`测试失败: ${error}`);
                setIsLoading(false);
            }
        };

        runTests();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">简单游戏测试</h1>

                {isLoading && (
                    <div className="mb-4 p-4 bg-blue-900 rounded-lg">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            <span>正在执行测试...</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 游戏测试区域 */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h2 className="text-xl font-semibold mb-4">游戏测试</h2>
                        <div className="bg-black rounded-lg overflow-hidden">
                            <div id="game-container" className="w-full h-64 flex items-center justify-center">
                                {isLoading && (
                                    <div className="text-gray-400">加载中...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 测试结果 */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h2 className="text-xl font-semibold mb-4">测试结果</h2>
                        <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto">
                            <div className="space-y-1 text-sm font-mono">
                                {testResults.map((result, index) => (
                                    <div key={index} className="text-gray-300">
                                        {result}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-x-4">
                    <a
                        href="/top-down-game"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        返回游戏页面
                    </a>
                </div>
            </div>
        </div>
    );
}

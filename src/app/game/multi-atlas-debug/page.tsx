'use client';

import { useEffect, useState } from 'react';

export default function MultiAtlasDebugPage() {
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [atlasConfigs, setAtlasConfigs] = useState({});

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const scanFarmAssets = async () => {
            try {
                const response = await fetch('/api/farm-assets');
                if (response.ok) {
                    const assets = await response.json();
                    console.log('Found assets:', assets);
                    setAtlasConfigs({ assets });
                }
            } catch (error) {
                console.error('Failed to scan farm assets:', error);
            } finally {
                setLoading(false);
            }
        };

        scanFarmAssets();
    }, [isClient]);

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl">正在初始化...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl">正在扫描farm-assets文件夹...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                <p className="text-gray-400 mb-6">自动扫描farm-assets文件夹下的所有图集</p>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">扫描结果</h2>
                    <pre className="text-sm text-gray-300">
                        {JSON.stringify(atlasConfigs, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

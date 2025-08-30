'use client';

import { useEffect, useState } from 'react';

export default function TestResourcesPage() {
  const [testResults, setTestResults] = useState<Array<{key: string, url: string, status: string}>>([]);

  useEffect(() => {
    const testResources = [
      { key: 'hero', url: '/assets/topdown/sprites/atlas/hero.png' },
      { key: 'tileset', url: '/assets/topdown/sprites/maps/tilesets/tileset.png' },
      { key: 'home_page_city', url: '/assets/topdown/sprites/maps/cities/home_page_city.json' },
      { key: 'main_menu_background', url: '/assets/topdown/images/main_menu_background.png' }
    ];

    const testResource = async (resource: {key: string, url: string}) => {
      try {
        const response = await fetch(resource.url, { method: 'HEAD' });
        return {
          ...resource,
          status: response.ok ? '✅ 可访问' : '❌ 不可访问'
        };
      } catch (error) {
        return {
          ...resource,
          status: '❌ 错误: ' + (error as Error).message
        };
      }
    };

    const runTests = async () => {
      const results = await Promise.all(testResources.map(testResource));
      setTestResults(results);
    };

    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">资源文件测试</h1>
      
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg">
            <div className="font-bold">{result.key}</div>
            <div className="text-gray-400 text-sm">{result.url}</div>
            <div className="text-lg mt-2">{result.status}</div>
          </div>
        ))}
      </div>

      {testResults.length === 0 && (
        <div className="text-center">
          <div className="text-xl">正在测试资源文件...</div>
        </div>
      )}
    </div>
  );
}
import { readdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';

/**
 * API端点：获取farm-assets文件夹下的所有PNG文件
 */
export async function GET() {
    try {
        // farm-assets文件夹路径
        const farmAssetsPath = join(process.cwd(), 'public', 'assets', 'farm-assets');

        // 读取文件夹内容
        const files = await readdir(farmAssetsPath);

        // 过滤出PNG文件
        const pngFiles = files.filter(file =>
            file.toLowerCase().endsWith('.png')
        );

        // 按文件名排序
        pngFiles.sort();

        console.log('Found farm assets:', pngFiles);

        return NextResponse.json(pngFiles);
    } catch (error) {
        console.error('Error scanning farm-assets folder:', error);
        return NextResponse.json(
            { error: 'Failed to scan farm-assets folder' },
            { status: 500 }
        );
    }
}

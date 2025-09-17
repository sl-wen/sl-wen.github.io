'use client';
/**
 * 图片转文字（OCR）页（/tools/img2text）
 *
 * 功能：
 * - 选择本地图片并在客户端进行 OCR 识别
 * - 支持中文简体、英文或中英混合，且可选择仅识别数字
 * - 展示识别进度并可复制识别结果
 *
 * 说明：
 * - 动态引入 tesseract.js，避免初始包体积过大
 * - 通过 worker.setParameters 配置数字白名单
 * - 处理过程包含加载语言、初始化与识别，结束后销毁 worker
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type LangOption = 'auto' | 'chi_sim' | 'eng' | 'chi_sim+eng';

export default function Img2TextPage() {
  // 图片 URL、文件名、语言选项、仅数字开关与状态
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [lang, setLang] = useState<LangOption>('chi_sim+eng');
  const [onlyDigits, setOnlyDigits] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const langOptions = useMemo(
    () => [
      { label: '自动/中英混合', value: 'chi_sim+eng' as LangOption },
      { label: '仅中文', value: 'chi_sim' as LangOption },
      { label: '仅英文', value: 'eng' as LangOption }
    ],
    []
  );

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setText('');
    setError(undefined);
  }, []);

  const doOcr = useCallback(async () => {
    if (!imageUrl) return;
    setIsLoading(true);
    setProgress(0);
    setError(undefined);
    setText('');
    try {
      // 动态引入 tesseract.js，避免首屏体积
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker({
        logger: (m: any) => {
          if (m?.progress && m.status !== 'recognizing text') return;
          if (typeof m.progress === 'number') setProgress(Math.round(m.progress * 100));
        }
      } as any);

      const langCode = lang === 'chi_sim+eng' ? 'chi_sim+eng' : lang;
      await worker.loadLanguage(langCode);
      await worker.initialize(langCode);

      if (onlyDigits) {
        // 配置仅数字的whitelist
        await worker.setParameters({ tessedit_char_whitelist: '0123456789' } as any);
      }

      const { data } = await worker.recognize(imageUrl);
      setText(data?.text || '');
      await worker.terminate();
    } catch (e: any) {
      setError(e?.message || '识别失败');
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl, lang, onlyDigits]);

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }, [text]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">图片转文字（OCR）</h1>
          <div className="flex gap-2">
            <Button onClick={handlePickFile} variant="secondary">选择图片</Button>
            <Button onClick={doOcr} isLoading={isLoading} disabled={!imageUrl}>开始识别</Button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">图片预览</h2>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt={fileName || '选中图片'} className="max-h-[420px] w-auto rounded-lg shadow" />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-700 rounded">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[420px] flex items-center justify-center text-gray-400">请先选择图片</div>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">语言</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  value={lang}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLang(e.target.value as LangOption)}
                >
                  {langOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={onlyDigits} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOnlyDigits(e.target.checked)} />
                  <span className="text-sm text-gray-800 dark:text-gray-200">仅识别数字</span>
                </label>
              </div>
            </div>
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">识别结果</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copyText} disabled={!text}>复制</Button>
              </div>
            </div>
            <Textarea value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="识别出的文字将显示在这里" className="min-h-[420px]" />
          </div>
        </div>
      </div>
    </div>
  );
}


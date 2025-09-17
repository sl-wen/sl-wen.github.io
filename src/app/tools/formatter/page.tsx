'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

// 动态加载 Prettier，仅在客户端使用，避免 SSR 体积
const prettierPromise = () => import('prettier/standalone');
const parserBabelPromise = () => import('prettier/plugins/babel');
const parserHtmlPromise = () => import('prettier/plugins/html');
const parserMarkdownPromise = () => import('prettier/plugins/markdown');
const parserTypescriptPromise = () => import('prettier/plugins/typescript');
const pluginEstreePromise = () => import('prettier/plugins/estree');

type Language = 'auto' | 'javascript' | 'typescript' | 'json' | 'markdown' | 'html' | 'css';

export default function CodeFormatterPage() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [language, setLanguage] = useState<Language>('auto');
  const [printWidth, setPrintWidth] = useState<number>(100);
  const [tabWidth, setTabWidth] = useState<number>(2);
  const [useTabs, setUseTabs] = useState<boolean>(false);
  const [semi, setSemi] = useState<boolean>(true);
  const [singleQuote, setSingleQuote] = useState<boolean>(false);
  const [trailingComma, setTrailingComma] = useState<'none' | 'es5' | 'all'>('es5');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const languageOptions: { label: string; value: Language }[] = useMemo(
    () => [
      { label: '自动识别', value: 'auto' },
      { label: 'JavaScript', value: 'javascript' },
      { label: 'TypeScript/TSX', value: 'typescript' },
      { label: 'JSON', value: 'json' },
      { label: 'Markdown', value: 'markdown' },
      { label: 'HTML', value: 'html' },
      { label: 'CSS', value: 'css' }
    ],
    []
  );

  const detectParser = useCallback(
    (lang: Language, sample: string): string => {
      if (lang !== 'auto') {
        switch (lang) {
          case 'javascript':
            return 'babel';
          case 'typescript':
            return 'typescript';
          case 'json':
            return 'json';
          case 'markdown':
            return 'markdown';
          case 'html':
            return 'html';
          case 'css':
            return 'css';
        }
      }
      const trimmed = sample.trimStart();
      if (trimmed.startsWith('<') || /<\w+[^>]*>/.test(trimmed)) return 'html';
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
      if (/^(#{1,6}\s|\-|\*\s|\d+\.\s)/.test(trimmed)) return 'markdown';
      if (/\binterface\b|\benum\b|:\s*[^=]/.test(sample)) return 'typescript';
      return 'babel';
    },
    []
  );

  const handleFormat = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [prettier, babel, html, markdown, typescript, estree] = await Promise.all([
        prettierPromise(),
        parserBabelPromise(),
        parserHtmlPromise(),
        parserMarkdownPromise(),
        parserTypescriptPromise(),
        pluginEstreePromise()
      ]);

      const parser = detectParser(language, inputCode);
      const formatted = await prettier.format(inputCode, {
        parser,
        plugins: [babel, html, markdown, typescript, estree],
        printWidth,
        tabWidth,
        useTabs,
        semi,
        singleQuote,
        trailingComma
      } as any);
      setOutputCode(formatted);
    } catch (e: any) {
      setError(e?.message || '格式化失败');
    } finally {
      setIsLoading(false);
    }
  }, [detectParser, inputCode, language, printWidth, tabWidth, useTabs, semi, singleQuote, trailingComma]);

  const handleSwap = useCallback(() => {
    setInputCode(outputCode);
  }, [outputCode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">代码格式化</h1>
          <div className="flex gap-2">
            <Button onClick={handleFormat} isLoading={isLoading}>格式化</Button>
            <Button variant="secondary" onClick={handleSwap}>将结果复制到输入</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">输入代码</h2>
                <Textarea
                  value={inputCode}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputCode(e.target.value)}
                  inputSize="lg"
                  fullWidth
                  autoResize
                  placeholder="在此粘贴代码..."
                  className="h-[360px]"
                />
                {error && (
                  <div className="mt-2 text-sm text-red-600">{error}</div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">格式化结果</h2>
                <Textarea
                  value={outputCode}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOutputCode(e.target.value)}
                  inputSize="lg"
                  fullWidth
                  autoResize
                  placeholder="格式化后的代码将显示在这里"
                  className="h-[360px]"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">语言</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  value={language}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as Language)}
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="number"
                    label="printWidth"
                    value={printWidth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrintWidth(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    label="tabWidth"
                    value={tabWidth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTabWidth(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-800 dark:text-gray-200">useTabs</label>
                <input type="checkbox" checked={useTabs} onChange={(e) => setUseTabs(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-800 dark:text-gray-200">semi</label>
                <input type="checkbox" checked={semi} onChange={(e) => setSemi(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-800 dark:text-gray-200">singleQuote</label>
                <input type="checkbox" checked={singleQuote} onChange={(e) => setSingleQuote(e.target.checked)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">trailingComma</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  value={trailingComma}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTrailingComma(e.target.value as any)}
                >
                  <option value="none">none</option>
                  <option value="es5">es5</option>
                  <option value="all">all</option>
                </select>
              </div>

              <Button onClick={handleFormat} isLoading={isLoading}>立即格式化</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


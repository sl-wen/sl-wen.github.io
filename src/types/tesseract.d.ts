declare module 'tesseract.js' {
  export function createWorker(options?: any): Promise<{
    loadLanguage: (lang: string) => Promise<void>;
    initialize: (lang: string) => Promise<void>;
    setParameters: (params: Record<string, string>) => Promise<void>;
    recognize: (image: string | File | Blob | ArrayBufferView) => Promise<{ data: { text: string } }>;
    terminate: () => Promise<void>;
  }>;
}


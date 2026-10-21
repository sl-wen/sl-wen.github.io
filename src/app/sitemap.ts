import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://slwen.cn';
  const lastModified = new Date();

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/tools`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tools/shici`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tools/caipiao`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/tools/novel`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/tools/qr`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/base64`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/hash`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/json`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/color`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/convert`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/crypto`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/diff`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/formatter`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/img`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/password`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/timestamp`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/img2text`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/img2json`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/tools/mortgage`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools/savings`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools/rates`, lastModified, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/tools/poll`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/about`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/category`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/search`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/topdown`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];

  return staticPages;
}

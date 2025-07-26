import React from 'react';
import { Card } from '@/components/ui';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card size="lg" className="shadow-lg">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">使用条款</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                欢迎使用我们的服务！在使用本网站之前，请仔细阅读以下条款和条件。通过访问和使用本网站，您同意遵守这些条款。
              </p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 服务条款接受</h2>
                <p className="text-gray-600 leading-relaxed">
                  欢迎使用鱼鱼的博客。通过访问和使用本网站，您同意遵守以下使用条款。
                  如果您不同意这些条款，请不要使用本网站。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 网站使用</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  本网站仅供个人、非商业用途使用。您同意：
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>不传播违法、有害、威胁、滥用、骚扰或诽谤的内容</li>
                  <li>不侵犯他人的知识产权或其他权利</li>
                  <li>不进行任何可能损害网站正常运行的行为</li>
                  <li>遵守所有适用的法律法规</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 用户内容</h2>
                <p className="text-gray-600 leading-relaxed">
                  您对提交到本网站的任何内容承担全部责任。我们保留删除任何违反这些条款的内容的权利，
                  但不承担监控用户内容的义务。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 知识产权</h2>
                <p className="text-gray-600 leading-relaxed">
                  本网站的所有内容，包括但不限于文本、图片、代码和设计，均受版权保护。
                  未经明确许可，不得复制、分发或修改这些内容。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 免责声明</h2>
                <p className="text-gray-600 leading-relaxed">
                  本网站按&quot;现状&quot;提供服务，不作任何明示或暗示的保证。我们不保证网站的可用性、
                  准确性或适用性，也不对因使用本网站而造成的任何损失承担责任。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 条款修改</h2>
                <p className="text-gray-600 leading-relaxed">
                  我们保留随时修改这些使用条款的权利。修改后的条款将在本页面上发布，
                  继续使用本网站即表示您接受修改后的条款。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 联系我们</h2>
                <p className="text-gray-600 leading-relaxed">
                  如果您对这些使用条款有任何疑问，请通过 sl-wen@outlook.com 联系我们。
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

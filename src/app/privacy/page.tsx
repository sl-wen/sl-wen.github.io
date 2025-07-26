import React from 'react';
import { Card } from '@/components/ui';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card size="lg" className="shadow-lg">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">隐私政策</h1>
              <p className="text-gray-600">
                最后更新时间：{new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 信息收集</h2>
                <p className="text-gray-600 leading-relaxed mb-4">我们可能收集以下类型的信息：</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>您主动提供的个人信息（如姓名、邮箱地址）</li>
                  <li>自动收集的技术信息（如IP地址、浏览器类型、访问时间）</li>
                  <li>Cookie和类似技术收集的信息</li>
                  <li>您与网站互动产生的使用数据</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 信息使用</h2>
                <p className="text-gray-600 leading-relaxed mb-4">我们使用收集的信息用于：</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>提供和改善我们的服务</li>
                  <li>处理您的请求和查询</li>
                  <li>发送重要通知和更新</li>
                  <li>分析网站使用情况以改善用户体验</li>
                  <li>防止欺诈和维护网站安全</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 信息共享</h2>
                <p className="text-gray-600 leading-relaxed">
                  我们不会出售、租赁或以其他方式向第三方披露您的个人信息，除非：
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>获得您的明确同意</li>
                  <li>法律要求或法律程序需要</li>
                  <li>保护我们的权利、财产或安全</li>
                  <li>与可信的服务提供商合作（他们受到保密协议约束）</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookie使用</h2>
                <p className="text-gray-600 leading-relaxed">
                  我们使用Cookie来改善您的浏览体验。Cookie是存储在您设备上的小文本文件，
                  帮助我们记住您的偏好设置并分析网站使用情况。您可以通过浏览器设置控制Cookie的使用。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 数据安全</h2>
                <p className="text-gray-600 leading-relaxed">
                  我们采取合理的技术和组织措施来保护您的个人信息免受未授权访问、使用、
                  修改或披露。但是，没有任何系统是完全安全的，我们无法保证绝对的安全性。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 您的权利</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  根据适用的隐私法律，您可能拥有以下权利：
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>访问您的个人信息</li>
                  <li>更正不准确的信息</li>
                  <li>删除您的个人信息</li>
                  <li>限制处理您的信息</li>
                  <li>数据可携性</li>
                  <li>反对处理您的信息</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 第三方链接</h2>
                <p className="text-gray-600 leading-relaxed">
                  本网站可能包含指向第三方网站的链接。我们不对这些网站的隐私做法负责。
                  我们建议您查看每个网站的隐私政策。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 政策更新</h2>
                <p className="text-gray-600 leading-relaxed">
                  我们可能会定期更新此隐私政策。重大变更将通过网站通知或其他适当方式告知您。
                  继续使用我们的服务即表示您接受更新后的政策。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 联系我们</h2>
                <p className="text-gray-600 leading-relaxed">
                  如果您对此隐私政策有任何疑问或关于您个人信息处理的投诉， 请通过 sl-wen@outlook.com
                  联系我们。
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

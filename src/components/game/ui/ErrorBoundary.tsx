import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('游戏错误:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // 可以在这里添加错误上报逻辑
    // 例如发送到错误监控服务
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-red-500 rounded-lg p-6 max-w-md mx-4">
            <div className="text-red-400 text-2xl mb-4 text-center">⚠️</div>
            <h2 className="text-white text-xl font-bold mb-4 text-center">
              游戏出现错误
            </h2>
            <div className="text-gray-300 text-sm mb-4">
              <p>抱歉，游戏遇到了一个错误。请尝试刷新页面重新开始。</p>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-gray-400 mb-4">
                <summary className="cursor-pointer text-red-400 mb-2">
                  错误详情 (开发模式)
                </summary>
                <div className="bg-gray-900 p-2 rounded overflow-auto max-h-32">
                  <div className="text-red-400 mb-1">
                    错误: {this.state.error.message}
                  </div>
                  <div className="text-gray-500">
                    堆栈: {this.state.error.stack}
                  </div>
                </div>
              </details>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                刷新页面
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
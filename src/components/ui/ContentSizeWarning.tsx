import React from 'react';

interface ContentSizeWarningProps {
  content: string;
  threshold?: number; // MB
}

export const ContentSizeWarning: React.FC<ContentSizeWarningProps> = ({
  content,
  threshold = 1
}) => {
  const sizeInBytes = new Blob([content]).size;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB < threshold) return null;

  const getWarningLevel = () => {
    if (sizeInMB >= 5) return 'error';
    if (sizeInMB >= 2) return 'warning';
    return 'info';
  };

  const getWarningMessage = () => {
    if (sizeInMB >= 5) {
      return {
        title: '内容过大',
        message: `当前内容大小为 ${sizeInMB.toFixed(2)}MB，可能导致提交失败。建议缩减内容长度。`,
        icon: '⚠️'
      };
    }
    if (sizeInMB >= 2) {
      return {
        title: '内容较大',
        message: `当前内容大小为 ${sizeInMB.toFixed(2)}MB，提交可能需要较长时间。`,
        icon: '⏳'
      };
    }
    return {
      title: '内容提醒',
      message: `当前内容大小为 ${sizeInMB.toFixed(2)}MB，处理时间可能稍长。`,
      icon: 'ℹ️'
    };
  };

  const warningLevel = getWarningLevel();
  const warningInfo = getWarningMessage();

  const getWarningClasses = () => {
    switch (warningLevel) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getWarningClasses()} mb-4`}>
      <div className="flex items-start">
        <span className="text-lg mr-2 flex-shrink-0">{warningInfo.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{warningInfo.title}</h4>
          <p className="text-xs mt-1">{warningInfo.message}</p>
          {warningLevel === 'error' && (
            <p className="text-xs mt-2 font-medium">
              建议：将长文章分段发布或删除不必要的内容
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentSizeWarning;
'use client';

import React, { useState, useEffect } from 'react';
import { TutorialManager, Tutorial, TutorialStep } from '../systems/TutorialManager';

interface TutorialUIProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TutorialUI: React.FC<TutorialUIProps> = ({
  isVisible,
  onClose
}) => {
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [showTutorialList, setShowTutorialList] = useState(false);

  const tutorialManager = TutorialManager.getInstance();

  useEffect(() => {
    if (isVisible) {
      loadTutorials();
      setupEventListeners();
    }
  }, [isVisible]);

  const loadTutorials = () => {
    const allTutorials = tutorialManager.getAllTutorials();
    setTutorials(allTutorials);
  };

  const setupEventListeners = () => {
    const handleTutorialEvent = (event: CustomEvent) => {
      const { tutorial, step, stepIndex: index } = event.detail;
      
      switch (event.type) {
        case 'tutorial-tutorial-started':
          setCurrentTutorial(tutorial);
          break;
        case 'tutorial-step-shown':
          setCurrentStep(step);
          setStepIndex(index);
          break;
        case 'tutorial-tutorial-completed':
        case 'tutorial-tutorial-skipped':
          setCurrentTutorial(null);
          setCurrentStep(null);
          setStepIndex(0);
          break;
      }
    };

    window.addEventListener('tutorial-tutorial-started', handleTutorialEvent as EventListener);
    window.addEventListener('tutorial-step-shown', handleTutorialEvent as EventListener);
    window.addEventListener('tutorial-tutorial-completed', handleTutorialEvent as EventListener);
    window.addEventListener('tutorial-tutorial-skipped', handleTutorialEvent as EventListener);

    return () => {
      window.removeEventListener('tutorial-tutorial-started', handleTutorialEvent as EventListener);
      window.removeEventListener('tutorial-step-shown', handleTutorialEvent as EventListener);
      window.removeEventListener('tutorial-tutorial-completed', handleTutorialEvent as EventListener);
      window.removeEventListener('tutorial-tutorial-skipped', handleTutorialEvent as EventListener);
    };
  };

  const startTutorial = (tutorialId: string) => {
    tutorialManager.startTutorial(tutorialId);
    setShowTutorialList(false);
  };

  const nextStep = () => {
    tutorialManager.nextStep();
  };

  const previousStep = () => {
    tutorialManager.previousStep();
  };

  const skipTutorial = () => {
    tutorialManager.skipTutorial();
  };

  const resetAllTutorials = () => {
    if (confirm('确定要重置所有教程进度吗？')) {
      tutorialManager.resetTutorialProgress();
      loadTutorials();
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'interactive':
        return '👆';
      case 'highlight':
        return '✨';
      case 'complete':
        return '✅';
      default:
        return '📝';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!isVisible) return null;

  // 显示教程列表
  if (showTutorialList) {
    const progress = tutorialManager.getTutorialProgress();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 text-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">📚 教程系统</h2>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              关闭
            </button>
          </div>

          {/* 进度概览 */}
          <div className="mb-6 p-4 bg-gray-800 rounded">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getProgressColor(progress.percentage)}`}>
                {progress.completed}/{progress.total}
              </div>
              <div className="text-sm text-gray-300">已完成教程</div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(progress.percentage)}% 完成
              </div>
            </div>
          </div>

          {/* 教程列表 */}
          <div className="space-y-4">
            {tutorials.map(tutorial => (
              <div
                key={tutorial.id}
                className={`p-4 rounded border-2 transition-all ${
                  tutorial.isCompleted
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {tutorial.isCompleted ? '✅' : '📖'}
                      </span>
                      <h3 className={`font-bold ${tutorial.isCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                        {tutorial.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {tutorial.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      步骤: {tutorial.steps.length} | 
                      {tutorial.autoStart ? ' 自动开始' : ' 手动开始'} | 
                      {tutorial.isSkippable ? ' 可跳过' : ' 不可跳过'}
                    </div>
                  </div>
                  <div className="ml-4">
                    {tutorial.isCompleted ? (
                      <span className="text-green-400 text-sm">已完成</span>
                    ) : (
                      <button
                        onClick={() => startTutorial(tutorial.id)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        开始
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={resetAllTutorials}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              重置所有教程
            </button>
            <button
              onClick={() => setShowTutorialList(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 显示当前教程步骤
  if (currentTutorial && currentStep) {
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === currentTutorial.steps.length - 1;
    const canSkip = currentTutorial.isSkippable;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 text-white p-6 rounded-lg max-w-md">
          {/* 教程标题 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{currentTutorial.name}</h3>
            <div className="text-sm text-gray-400">
              {stepIndex + 1} / {currentTutorial.steps.length}
            </div>
          </div>

          {/* 步骤内容 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{getStepIcon(currentStep.type)}</span>
              <h4 className="text-lg font-semibold">{currentStep.title}</h4>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {currentStep.description}
            </p>
            {currentStep.required && (
              <div className="mt-2 text-xs text-yellow-400">
                ⚠️ 此步骤必须完成
              </div>
            )}
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / currentTutorial.steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={previousStep}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                >
                  上一步
                </button>
              )}
              {canSkip && (
                <button
                  onClick={skipTutorial}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                >
                  跳过
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowTutorialList(true)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
              >
                教程列表
              </button>
              {isLastStep ? (
                <button
                  onClick={nextStep}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                >
                  完成
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  下一步
                </button>
              )}
            </div>
          </div>

          {/* 快捷键提示 */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            空格键: 下一步 | ESC键: 关闭
          </div>
        </div>
      </div>
    );
  }

  // 默认显示教程列表
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg max-w-md">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-bold mb-4">教程系统</h2>
          <p className="text-gray-300 mb-6">
            选择要学习的教程，或者查看所有可用的教程。
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowTutorialList(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-sm"
            >
              查看所有教程
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
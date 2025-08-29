'use client';

import React, { useState, useEffect } from 'react';
import { HelpManager, HelpCategory, HelpArticle } from '../systems/HelpManager';

interface HelpUIProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HelpUI: React.FC<HelpUIProps> = ({
  isVisible,
  onClose
}) => {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'search' | 'favorites' | 'popular'>('categories');
  const [favorites, setFavorites] = useState<HelpArticle[]>([]);
  const [popularArticles, setPopularArticles] = useState<HelpArticle[]>([]);

  const helpManager = HelpManager.getInstance();

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = () => {
    const allCategories = helpManager.getAllCategories();
    setCategories(allCategories);
    setFavorites(helpManager.getFavorites());
    setPopularArticles(helpManager.getPopularArticles());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = helpManager.searchArticles(query);
      setSearchResults(results);
      helpManager.addToSearchHistory(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleCategorySelect = (category: HelpCategory) => {
    setSelectedCategory(category);
    setSelectedArticle(null);
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const toggleFavorite = (articleId: string) => {
    if (helpManager.isFavorite(articleId)) {
      helpManager.removeFromFavorites(articleId);
    } else {
      helpManager.addToFavorites(articleId);
    }
    setFavorites(helpManager.getFavorites());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '初级';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return '未知';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* 侧边栏 */}
        <div className="w-80 flex-shrink-0 border-r border-gray-700 flex flex-col">
          {/* 标题 */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">❓ 帮助系统</h2>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              关闭
            </button>
          </div>

          {/* 搜索框 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="搜索帮助内容..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            />
          </div>

          {/* 标签页 */}
          <div className="flex mb-4">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-3 py-2 text-sm rounded-l ${
                activeTab === 'categories' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              分类
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-3 py-2 text-sm ${
                activeTab === 'search' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              搜索
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-3 py-2 text-sm ${
                activeTab === 'favorites' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              收藏
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 px-3 py-2 text-sm rounded-r ${
                activeTab === 'popular' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              热门
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'categories' && (
              <div className="space-y-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedCategory?.id === category.id
                        ? 'bg-blue-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{category.icon}</span>
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400">{category.description}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.articles.length} 篇文章
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-2">
                {searchResults.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{article.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                            {getDifficultyText(article.difficulty)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {article.tags.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article.id);
                        }}
                        className="text-gray-400 hover:text-yellow-400"
                      >
                        {helpManager.isFavorite(article.id) ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    没有找到相关结果
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-2">
                {favorites.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{article.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                            {getDifficultyText(article.difficulty)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {article.tags.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article.id);
                        }}
                        className="text-yellow-400 hover:text-gray-400"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                ))}
                {favorites.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    暂无收藏文章
                  </div>
                )}
              </div>
            )}

            {activeTab === 'popular' && (
              <div className="space-y-2">
                {popularArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{article.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                            {getDifficultyText(article.difficulty)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {article.tags.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article.id);
                        }}
                        className="text-gray-400 hover:text-yellow-400"
                      >
                        {helpManager.isFavorite(article.id) ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col ml-6">
          {selectedCategory && !selectedArticle && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{selectedCategory.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{selectedCategory.name}</h2>
                  <p className="text-gray-400">{selectedCategory.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCategory.articles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => handleArticleSelect(article)}
                    className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{article.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article.id);
                        }}
                        className="text-gray-400 hover:text-yellow-400"
                      >
                        {helpManager.isFavorite(article.id) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(article.difficulty)} bg-gray-700`}>
                        {getDifficultyText(article.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">
                        更新于 {article.lastUpdated}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedArticle && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    ← 返回
                  </button>
                  <h2 className="text-xl font-bold">{selectedArticle.title}</h2>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedArticle.id)}
                  className="text-2xl hover:text-yellow-400"
                >
                  {helpManager.isFavorite(selectedArticle.id) ? '★' : '☆'}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                <span className={`px-2 py-1 rounded ${getDifficultyColor(selectedArticle.difficulty)} bg-gray-700`}>
                  {getDifficultyText(selectedArticle.difficulty)}
                </span>
                <span>更新于 {selectedArticle.lastUpdated}</span>
                <div className="flex gap-1">
                  {selectedArticle.tags.map(tag => (
                    <span key={tag} className="bg-blue-600 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedArticle.content
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                      .replace(/- (.*?)\n/g, '<li class="ml-4">$1</li>')
                      .replace(/(\d+)\. (.*?)\n/g, '<li class="ml-4">$2</li>')
                  }}
                />
              </div>
            </div>
          )}

          {!selectedCategory && !selectedArticle && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">❓</div>
                <h2 className="text-2xl font-bold mb-2">欢迎使用帮助系统</h2>
                <p className="text-gray-400 mb-4">
                  选择左侧的分类或使用搜索功能来查找帮助内容
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-semibold">分类浏览</div>
                    <div className="text-gray-400">按主题分类查看帮助</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="font-semibold">搜索功能</div>
                    <div className="text-gray-400">快速查找相关内容</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="font-semibold">收藏功能</div>
                    <div className="text-gray-400">收藏常用帮助文章</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <div className="text-2xl mb-2">🔥</div>
                    <div className="font-semibold">热门内容</div>
                    <div className="text-gray-400">查看最受欢迎的帮助</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
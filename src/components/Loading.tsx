import React from 'react';

const Loading: React.FC = () => (
  <div className="loading">
    <div className="octocat-container">
      <div className="octocat-arm"></div>
    </div>
    <p className="loading-text">加载中...</p>
  </div>
);

export default Loading;
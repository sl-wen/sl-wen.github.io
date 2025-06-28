import React from 'react';
import '../styles/Loading.css';

const Loading: React.FC = () => (
  <div className="loading">
    <div className="octocatContainer">
      <div className="octocatArm"></div>
    </div>
    <p className="loadingText">加载中...</p>
  </div>
);

export default Loading;
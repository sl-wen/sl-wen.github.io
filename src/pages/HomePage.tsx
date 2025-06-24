import React from 'react';
import CommonHeader from '../components/CommonHeader';
import CommonFooter from '../components/CommonFooter';
import Loading from '../components/Loading';

const HomePage: React.FC = () => (
  <div className="page home-page">
    <div id="common-header">
      <CommonHeader />
    </div>
    <div className="container">
      <div id="status-messages" className="status-messages"></div>
      <div id="posts-container">
        <Loading />
      </div>
    </div>
    <div id="common-footer">
      <CommonFooter />
    </div>
  </div>
);

export default HomePage;
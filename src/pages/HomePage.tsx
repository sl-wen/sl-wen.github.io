import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';

const HomePage: React.FC = () => (
  <div className="page home-page">
    <div id="common-header">
      <Header />
    </div>
    <div className="container">
      <div id="status-messages" className="status-messages"></div>
      <div id="posts-container">
        <Loading />
      </div>
    </div>
    <div id="common-footer">
      <Footer />
    </div>
  </div>
);

export default HomePage;
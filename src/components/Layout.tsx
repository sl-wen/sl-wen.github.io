import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div id="status-messages" className="status-messages"></div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
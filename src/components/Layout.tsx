import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import '../styles/Index.css';
import '../styles/Layout.css';


const Layout: React.FC = () => {
  return (
    <div className="appContainer">
      <Header />
      <main className="mainContent">
        <div id="status-messages" className="statusMessages"></div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
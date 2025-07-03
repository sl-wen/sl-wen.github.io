import React from 'react';
import Header from './Header';
import Footer from './Footer';
import '../styles/Common.css';
import '../styles/Layout.css';
import '../styles/MobileOptimization.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="appContainer">
      <Header />
      <main className="mainContent">
        <div id="status-messages" className="statusMessages"></div>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

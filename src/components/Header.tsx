import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase-config';
import '../styles/header.css';

interface UserProfile {
  username?: string;
  avatar_url?: string;
  email: string;
}

const Header: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userSession');
      setUserProfile(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-auth">
        <Link to="/" className="logo">
          <img
            src="/static/img/logo.jpg"
            alt="Logo"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/static/img/logo.png';
            }}
          />
        </Link>
        <div className="auth" id="auth">
          {userProfile ? (
            <div className="user-menu">
              <div className="user-menu">
                <div className="user-profile" id="userProfileButton">
                  <span id="welcome">欢迎，${userProfile?.username}</span>
                  <i className="dropdown-icon">▼</i>
                </div>
                <div className="dropdown-menu" id="userDropdownMenu">
                  <ul className="dropdown-list">
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>个人</Link>
                    <Link to="/settings" onClick={() => setIsMenuOpen(false)}>设置</Link>
                    <li onClick={handleLogout} className="logout-btn"> 登出</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="primary-btn active">登录</Link>
          )}
        </div>
      </div>
      <button
        className="menu-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
      </button>
      <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>首页</Link>
        <Link to="/category" onClick={() => setIsMenuOpen(false)}>分类</Link>
        <Link to="/search" onClick={() => setIsMenuOpen(false)}>搜索</Link>
        {userProfile && (
          <>
            <Link to="/tools" onClick={() => setIsMenuOpen(false)}>工具</Link>
            <Link to="/post" onClick={() => setIsMenuOpen(false)}>发布文章</Link>
          </>
        )}
        <Link to="/about" onClick={() => setIsMenuOpen(false)}>关于</Link>
      </nav>
    </header>
  );
};

export default Header;
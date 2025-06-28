import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase-config';
import '../styles/Header.css';

interface UserProfile {
  username?: string;
  avatar_url?: string;
  email: string;
}

const Header: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }

    // 监听登录状态变化
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = localStorage.getItem('userProfile');
        if (profile) {
          setUserProfile(JSON.parse(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });

    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
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
      <div className="headerAuth">
        <Link to="/" className="logo">
          <img
            src="static/img/logo.jpg"
            alt="Logo"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/dist/static/img/logo.png';
            }}
          />
        </Link>
        <div className="auth">
          {userProfile ? (
            <div className="userMenu" ref={dropdownRef}>
              <div className="userProfile" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span className="welcome">欢迎 {userProfile?.username}</span>
                <i
                  className="dropdownIcon"
                  style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}
                >
                  ▼
                </i>
              </div>
              {isDropdownOpen && (
                <div className="dropdownMenu">
                  <ul className="dropdownList">
                    <Link
                      to="/profile"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      个人
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      设置
                    </Link>
                    <li
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="logoutBtn"
                    >
                      登出
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="primaryBtn">
              登录
            </Link>
          )}
        </div>
      </div>
      <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          首页
        </Link>
        <Link to="/category" onClick={() => setIsMenuOpen(false)}>
          分类
        </Link>
        <Link to="/search" onClick={() => setIsMenuOpen(false)}>
          搜索
        </Link>
        {userProfile && (
          <>
            <Link to="/tools" onClick={() => setIsMenuOpen(false)}>
              工具
            </Link>
            <Link to="/post" onClick={() => setIsMenuOpen(false)}>
              发布文章
            </Link>
          </>
        )}
        <Link to="/about" onClick={() => setIsMenuOpen(false)}>
          关于
        </Link>
      </nav>
    </header>
  );
};

export default Header;

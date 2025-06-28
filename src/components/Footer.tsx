import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVisitCount, incrementVisitCount } from '../utils/stats';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        const count = await getVisitCount();
        setVisitCount(count);
        incrementVisitCount();
      } catch (error) {
        console.error('获取访问量失败:', error);
      }
    };

    fetchVisitCount();
  }, []);

  return (
    <footer className="footer">
      <div className="copyright">
        © {new Date().getFullYear()} . All rights reserved.
      </div>
      <div className="footerStats">
        总访问量：<span>{visitCount}</span>
      </div>
      <Link to="/static/xml/rss.xml">RSS</Link>
    </footer>
  );
};

export default Footer;
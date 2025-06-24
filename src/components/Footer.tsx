import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVisitCount } from '../utils/stats';

const Footer: React.FC = () => {
  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        const count = await getVisitCount();
        setVisitCount(count);
      } catch (error) {
        console.error('获取访问量失败:', error);
      }
    };

    fetchVisitCount();
  }, []);

  return (
    <footer className="footer">
      <div className="copyright">
        © {new Date().getFullYear()} 鱼鱼的博客. All rights reserved.
      </div>
      <div className="footer-stats">
        总访问量：<span>{visitCount}</span>
      </div>
      <Link to="/static/xml/rss.xml">RSS</Link>
    </footer>
  );
};

export default Footer;
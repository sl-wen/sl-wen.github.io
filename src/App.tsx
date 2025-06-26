import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import CategoryPage from './pages/CategoryPage';
import AboutPage from './pages/AboutPage';
import PostPage from './pages/PostPage';
import ArticlePage from './pages/ArticlePage';
import './styles/index.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="category" element={<CategoryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="post" element={<PostPage />} />
        <Route path="article/:post_id" element={<ArticlePage />} />
      </Route>
    </Routes>
  );
};

export default App;
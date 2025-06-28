import {
  Route,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements
} from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import EditArticlePage from './pages/EditArticlePage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';
import AboutPage from './pages/AboutPage';
import PostPage from './pages/PostPage';
import ArticlePage from './pages/ArticlePage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="category" element={<CategoryPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="edit/:post_id" element={<EditArticlePage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="tools" element={<ToolsPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="post" element={<PostPage />} />
      <Route path="article/:post_id" element={<ArticlePage />} />
    </Route>
  ),
  {
    future: {
      // 移除了不支持的 v7_startTransition 配置项
      v7_relativeSplatPath: true
    }
  }
);

// 在根组件中使用
function App() {
  return <RouterProvider router={router} />;
}

export default App;

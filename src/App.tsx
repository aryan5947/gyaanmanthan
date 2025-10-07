import { Routes, Route, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"; 
import ErrorBoundary from "./components/ErrorBoundary"; 
import AdsPage from "./pages/AdsPage";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import FeedPage from "./pages/FeedPage";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import EditPostPage from "./pages/EditPostPage";
import Login from "./pages/Login";
import Privacy from "./components/Privacy";
import About from "./components/About";
import Disclaimer from "./components/Disclaimer";
import Signup from "./pages/Signup";
import PostWithFeed from "./pages/PostWithFeed";
import NotificationTab from "./components/NotificationTab";

// ✅ PostMeta pages
import PostMetaFeed from "./pages/PostMetaFeed";
import PostMetaForm from "./pages/PostMetaForm";
import UserPostMetas from "./pages/UserPostMetas";
import PostMetaDetail from "./pages/PostMetaDetail";

// ✅ New Selector page
import PostTypeSelector from "./pages/PostTypeSelector";

// ✅ Email verification & reset password pages
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ResetPassword from "./pages/Auth/ResetPassword";

// ✅ ProtectedRoute wrapper
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ Global Login Modal
import LoginModal from "./components/LoginModal";

// ✅ Auth check hook
import { useAuthCheck } from "./hooks/useAuthCheck";

export default function App() {
  const navigate = useNavigate();

  // 🔥 App start होते ही auth check
  useAuthCheck();

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/ads" element={<AdsPage />} />
            <Route path="/user/:id" element={<UserProfile />} />

            {/* PostMeta Routes */}
            <Route path="/post-meta/feed" element={<PostMetaFeed />} />
            <Route path="/post-meta/create" element={
              <ProtectedRoute>
                <PostMetaForm />
              </ProtectedRoute>
            } />
            <Route path="/post-meta/user/:id" element={<UserPostMetas />} />
            <Route path="/post-meta/:id" element={<PostMetaDetail />} />

            {/* Post detail routes */}
            <Route path="/post/:id" element={<PostWithFeed />} />
            <Route path="/edit-post/:id" element={
              <ProtectedRoute>
                <EditPostPage />
              </ProtectedRoute>
            } />

            {/* Selector */}
            <Route
              path="/choose-post-type"
              element={<PostTypeSelector onClose={() => navigate(-1)} />}
            />

            {/* Notifications */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationTab />
              </ProtectedRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <Create />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/edit-profile" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>

        {/* 🔥 Global Login Modal (always mounted) */}
        <LoginModal />
      </HelmetProvider>
    </ErrorBoundary>
  );
}

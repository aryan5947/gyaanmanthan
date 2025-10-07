import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShare } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import Header from '../components/Header';
import QuickActions from '../components/QuickActions';
import StatsCard from '../components/StatsCard';
import RecentActivity from '../components/RecentActivity';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/create');
  };

  const handleExplore = () => {
    navigate('/feed');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert('📎 Dashboard link copied to clipboard!'))
      .catch(() => alert('❌ Failed to copy link.'));
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar: Header + Icons */}
      <div className="dashboard-topbar">
        <Header
          title="📊 Dashboard"
          subtitle="Welcome back! Here's your learning overview."
        />
       <div className="dashboard-icons">
        <button onClick={handleShare} className="icon-btn" title="Share Dashboard">
        <FiShare size={30} /> {/* Increased from 22 */}
        </button>
        <button onClick={handleProfile} className="icon-btn" title="Go to Profile">
        <FaUserCircle size={36} /> {/* Increased from 26 */}
        </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <QuickActions handleCreate={handleCreate} handleExplore={handleExplore} />
      </div>

      {/* Dashboard Widgets */}
      <section className="dashboard-widgets">
        <div className="dashboard-widget">
          <StatsCard posts={120} followers={340} bookmarks={18} />
        </div>

        <div className="dashboard-widget">
          <RecentActivity
            items={[
              'Commented on “Algebra Tricks”',
              'Bookmarked “Newton’s Laws”',
              'Followed Riya Verma',
            ]}
          />
        </div>
      </section>
    </div>
  );
}

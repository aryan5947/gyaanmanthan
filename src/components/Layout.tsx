import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import SidebarTrustBlock from "../components/SidebarTrustBlock";
import { motion } from "framer-motion";
import {
  HomeIcon,
  ChartBarIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"; // ✅ Heroicons imports
import PostTypeSelectorModal from "../pages/PostTypeSelector";
import "./Layout.css";

type UserType = {
  name: string;
  avatarUrl: string;
};

const tabItems = [
  { label: "Home", icon: <HomeIcon className="h-6 w-6" />, to: "/" },
  { label: "Statuses", icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />, to: "/statuses" },
  { label: "Notifications", icon: <BellIcon className="h-6 w-6" />, to: "/notifications" },
  { label: "Full Page Post", icon: <DocumentTextIcon className="h-6 w-6" />, to: "/feed" },
  // { label: "Create", icon: <PencilSquareIcon className="h-6 w-6" />, to: "/create" },
  { label: "Profile", icon: <UserCircleIcon className="h-6 w-6" />, to: "/profile" },

  // 👇 Legal/Trust Pages with better suited icons
  { label: "About Us", icon: <InformationCircleIcon className="h-6 w-6" />, to: "/about" },
  { label: "Privacy Policy", icon: <ShieldCheckIcon className="h-6 w-6" />, to: "/privacy" },
  { label: "Disclaimer", icon: <ExclamationTriangleIcon className="h-6 w-6" />, to: "/disclaimer" },
];

export default function Layout() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false); // device type detected
  const [splashDone, setSplashDone] = useState(false); // minimum splash duration
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect mobile and tablet screens
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setIsMobile(width <= 600);
      setIsTablet(width > 600 && width <= 1024);
      setDeviceReady(true);
    }
    handleResize();
    window.addEventListener("resize", handleResize);

    // Maintain a minimal splash duration for a premium feel
    const timer = setTimeout(() => setSplashDone(true), 1500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const isReady = deviceReady && splashDone;

  // Greeting logic
  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "सुप्रभात";
    if (hour >= 12 && hour < 17) return "नमस्ते";
    if (hour >= 17 && hour < 20) return "शुभ संध्या";
    return "शुभ रात्रि";
  }

  // User profile fetch
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const u = data.user || data;
        setUser({ name: u.name, avatarUrl: u.avatarUrl });
      })
      .catch(() => setUser(null));
  }, []);

  // Scroll logic for sidebar hide on mobile/tablet
  useEffect(() => {
    const el = contentRef.current;
    if (!el || (!isMobile && !isTablet)) return;
    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      setShowSidebar(currentScrollY <= lastScrollY);
      setLastScrollY(currentScrollY);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile, isTablet]);

  // Splash Screen (Pro-level, dark, with Welcome to GyaanManthan)
  if (!isReady) {
    return (
      <div className="splash-loader" aria-live="polite" aria-busy="true">
        <motion.div
          className="splash-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.img
          src="/gyaanmanthan-logo.png"
          alt="GyaanManthan Logo"
          className="splash-logo"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.h1
          className="splash-text"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Welcome to <span>GyaanManthan</span>
        </motion.h1>
        <motion.p
          className="splash-subtext"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 0.95 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          ज्ञान ही शक्ति है
        </motion.p>

        <div className="splash-spinner" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      {/* Desktop Layout */}
      {!isMobile && !isTablet && (
        <>
          <aside className={`sidebar ${showSidebar ? "visible" : "hidden"}`}>
            <div
              className="sidebarHeader"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div
                className="brandRow"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 12px",
                }}
              >
                <motion.img
                  src="/gyaanmanthan-logo.png"
                  alt="GyaanManthan Logo"
                  className="logo-img"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                />
                <span className="logo-text">GyaanManthan</span>
              </div>
              {user && (
                <div
                  className="userMiniProfile"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="userAvatar"
                  />
                  <span className="userName">
                    {getGreeting()} {user.name} 🙏
                  </span>
                </div>
              )}
            </div>
            <nav className="nav-links">
              <ul>
                {tabItems.map(({ label, icon, to }) => {
                  if (label === "Notifications") {
                    return (
                      <div key={label}>
                        <li>
                          <Link
                            to={to}
                            className={`nav-item${location.pathname === to ? " active" : ""}`}
                          >
                            <span className="icon">{icon}</span>
                            <span className="label">{label}</span>
                          </Link>
                        </li>

                        {/* ✅ Profile के नीचे Choose Post Type */}
                        <li>
                          <button className="nav-item" onClick={() => setOpenModal(true)}>
                            <span className="icon">
                              <PencilSquareIcon className="h-6 w-6" />
                            </span>
                            <span className="label">Choose Post Type</span>
                          </button>
                        </li>
                      </div>
                    );
                  }

                  return (
                    <li key={label}>
                      <Link
                        to={to}
                        className={`nav-item${location.pathname === to ? " active" : ""}`}
                      >
                        <span className="icon">{icon}</span>
                        <span className="label">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="main-content" ref={contentRef}>
            <Outlet />
          </main>

          <aside className="right-panel">
            <div className="right-panel-card">
              <h2>ट्रेंडिंग</h2>
              <ul>
                <li>#टेक्नोलॉजी</li>
                <li>#खबरें</li>
                <li>#खास_रिपोर्ट</li>
              </ul>
            </div>
            <div className="right-panel-card">
              <h2>फॉलो करें</h2>
              <ul>
                <li>Rahul Kumar</li>
                <li>Anjali Singh</li>
                <li>GlobalNews Hindi</li>
              </ul>
            </div>
            <SidebarTrustBlock />
          </aside>
        </>
      )}

      {/* Mobile & Tablet Layout: top logo, main, bottom tabbar */}
      {(isMobile || isTablet) && (
        <>
          <div className="sidebarHeader">
            <div className="sidebarHeader-left">
              <motion.img
                src="/gyaanmanthan-logo.png"
                alt="GyaanManthan Logo"
                className="logo-img"
              />
              <span className="logo-text">GyaanManthan</span>
            </div>

            {user && (
              <div className="userMiniProfile">
                <img src={user.avatarUrl} alt={user.name} className="userAvatar" />
              </div>
            )}
          </div>

          <main className="main-content" ref={contentRef} style={{ paddingTop: 0 }}>
            <Outlet />
          </main>

          <nav className="bottom-tabbar">
            <Link
              to="/"
              className={`tab-icon${location.pathname === "/" ? " active" : ""}`}
              aria-label="Home"
            >
              <HomeIcon className="h-6 w-6" />
            </Link>

            <Link
              to="/statuses"
              className={`tab-icon${location.pathname === "/statuses" ? " active" : ""}`}
              aria-label="statuses"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </Link>

            <button
              className="tab-icon"
              aria-label="Choose Post Type"
              type="button"
              style={{ background: "none", border: "none" }}
              onClick={() => setOpenModal(true)}
            >
              <PencilSquareIcon className="h-6 w-6" />
            </button>

            <Link
              to="/notifications"
              className={`tab-icon${location.pathname === "/notifications" ? " active" : ""}`}
              aria-label="notifications"
            >
              <BellIcon className="h-6 w-6" />
            </Link>
            <Link
              to="/profile"
              className={`tab-icon${location.pathname === "/profile" ? " active" : ""}`}
              aria-label="Profile"
            >
              <UserCircleIcon className="h-6 w-6" />
            </Link>
          </nav>
        </>
      )}

      {/* Modal */}
      {openModal && <PostTypeSelectorModal onClose={() => setOpenModal(false)} />}
    </div>
  );
}
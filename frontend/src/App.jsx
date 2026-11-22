import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SwitchRole from "./pages/SwitchRole";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Boards from "./pages/Boards";
import BoardDetail from "./pages/BoardDetail";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

// Visitors who try a logged-in page are sent to create an account.
// If your login ran out, you are sent to log in instead.
function Protected({ children }) {
  const { user, loading, expired } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user)
    return <Navigate to={expired ? "/login" : "/register"} state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const onAuthPage = ["/login", "/register"].includes(pathname) || pathname.startsWith("/switch/");

  return (
    <>
      {!onAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/switch/:role" element={<Protected><SwitchRole /></Protected>} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/boards" element={<Protected><Boards /></Protected>} />
        <Route path="/boards/:id" element={<BoardDetail />} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/u/:id" element={<PublicProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!onAuthPage && <Footer />}
    </>
  );
}
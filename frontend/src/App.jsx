import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import DesignProject from "./pages/DesignProject";
import RFP from "./pages/RFP";

import { PrivateRoute } from "./routes/PrivateRoute";
import { PublicRoute } from "./routes/PublicRoute";
import ScrollToTop from "./components/ScrollToTop";
import RFPDetail from "./pages/RFPDetail";
import RFPEOIDetail from "./components/RFPEOIDetail";
import RFPEOI from "./pages/RFPEOI";

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route
          path="/welcome"
          element={
            <PrivateRoute>
              <Welcome />
            </PrivateRoute>
          }
        />
        <Route
          path="/design"
          element={
            <PrivateRoute>
              <DesignProject />
            </PrivateRoute>
          }
        />
    
        <Route
          path="/rfptracker"
          element={
            <PrivateRoute>
              <RFP />
            </PrivateRoute>
          }
        />
        <Route
          path="/rfptracker/:projectId"
          element={
            <PrivateRoute>
              <RFPDetail />
            </PrivateRoute>}
        />
        <Route
          path="/rfp/:projectId/:ngomatchId"
          element={
            <PrivateRoute>
              <RFPEOI />
            </PrivateRoute>}
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>

      <ToastContainer />
    </>
  );
}

export default App;
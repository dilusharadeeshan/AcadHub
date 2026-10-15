import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import AllNotices from "./pages/notices/AllNotices";


function App() {
  return (
        <AuthProvider>

  <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
<Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>


<Route
  path="/user-dashboard"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>
          
        <Route path="/register" element={<Register />} />
        <Route path="/notices" element={<AllNotices />} />
      </Routes>
    </BrowserRouter>
        </AuthProvider>

  ) ;
}

export default App;
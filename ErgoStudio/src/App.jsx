import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ThemeProvider } from "./context/ThemeContext";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import AppDashboard from "./pages/AppDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-sage border-t-transparent animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function App() {
  useEffect(() => {
    document.title = "ErgoStudy — Estudia sin molestias";
  }, []);
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={
                  <PublicOnly>
                    <AuthPage />
                  </PublicOnly>
                }
              />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;

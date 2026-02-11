import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { useTheme } from './hooks/useTheme';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? '#374151' : '#fff',
            color: isDark ? '#fff' : '#000',
          },
        }}
      />
      
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginForm />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterForm />}
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to air.ai
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Chat interface coming soon...
                  </p>
                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="ml-4 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Toggle {isDark ? 'Light' : 'Dark'} Mode
                  </button>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
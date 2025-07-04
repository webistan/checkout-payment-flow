import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibleRoute from './components/AccessibleRoute';
import PageNotFound from './pages/PageNotFound/PageNotFound';
import PublicRoute from './components/PublicRoute';
import CheckoutPage from './pages/Checkout/Checkout';
import './App.css';

// Routes
const routes = [
  {
    path: '/checkout',
    element: <CheckoutPage />,
    isProtected: true,
  },

  {
    path: '*',
    element: <PageNotFound />,
    isProtected: false,
  },
];

function App() {
  // const [isMobile, setIsMobile] = useState(false);

  // useEffect(() => {
  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth <= 768);
  //   };

  //   checkMobile();
  //   window.addEventListener('resize', checkMobile);

  //   return () => window.removeEventListener('resize', checkMobile);
  // }, []);

  // // if (isMobile) {
  // //   return <MobileBlocker />;
  // // }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {routes.map(({ path, element, isProtected, isBoth = false }) => (
            <Route
              key={path}
              path={path}
              element={
                isBoth ? (
                  <AccessibleRoute>{element}</AccessibleRoute>
                ) : isProtected ? (
                  <ProtectedRoute>{element}</ProtectedRoute>
                ) : (
                  <PublicRoute element={element} />
                )
              }
            />
          ))}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import MeteorBackground from './components/MeteorBackground';
import DiscoverPage from './pages/DiscoverPage';
import HomePage from './pages/HomePage';
import MySpacePage from './pages/MySpacePage';

/* Pengatur navigasi rute halaman web dan bungkus semantik tag main */
export default function App() {
  return (
    <BrowserRouter>
      <MeteorBackground />
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/my-space" element={<MySpacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

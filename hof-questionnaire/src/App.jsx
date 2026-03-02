import { Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage.jsx'
import SurveyPage from './pages/SurveyPage.jsx'
import ThankYouPage from './pages/ThankYouPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Admin */}
      <Route path="/admin" element={<AdminPage />} />

      {/* Customer Survey */}
      <Route path="/survey/:slug" element={<SurveyPage />} />
      <Route path="/survey/:slug/danke" element={<ThankYouPage />} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

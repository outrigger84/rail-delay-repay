import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppNav } from './components/ui/AppNav'
import { SearchScreen } from './components/search/SearchScreen'
import { JourneyResults } from './components/results/JourneyResults'
import { TicketSetupWizard } from './components/wizard/TicketSetupWizard'
import { LiveMonitor } from './components/monitor/LiveMonitor'
import { ClaimsDashboard } from './components/dashboard/ClaimsDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg">
        <AppNav />
        <main className="pb-16">
          <Routes>
            <Route path="/rail-delay-repay/" element={<SearchScreen />} />
            <Route path="/rail-delay-repay/results" element={<JourneyResults />} />
            <Route path="/rail-delay-repay/wizard" element={<TicketSetupWizard />} />
            <Route path="/rail-delay-repay/monitor" element={<LiveMonitor />} />
            <Route path="/rail-delay-repay/dashboard" element={<ClaimsDashboard />} />
            <Route path="*" element={<Navigate to="/rail-delay-repay/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

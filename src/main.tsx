import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

// Import route components
import RootLayout from './routes/__root'
import Dashboard from './routes/index'
import Agents from './routes/agents'
import Chat from './routes/chat'
import Analytics from './routes/analytics'
import Browser from './routes/browser'
import DevPage from './routes/dev'
import DevApprovals from './routes/dev/approvals'
import Memory from './routes/memory'
import Pipelines from './routes/pipelines'
import Settings from './routes/settings'
import ProvidersSettings from './routes/settings/providers'
import Sentinel from './routes/sentinel'
import Skills from './routes/skills'
import Monitoring from './routes/monitoring'

// Imperial Vault routes
import ImperialVaultLayout from './routes/imperial-vault/route'
import ImperialVault from './routes/imperial-vault/index'
import IVPipeline from './routes/imperial-vault/pipeline'
import IVCalendar from './routes/imperial-vault/calendar'
import IVIntel from './routes/imperial-vault/intel'
import IVIntelligence from './routes/imperial-vault/intelligence'
import IVFootage from './routes/imperial-vault/footage'
import IVMusic from './routes/imperial-vault/music'
import IVDiscord from './routes/imperial-vault/discord'
import IVOverlay from './routes/imperial-vault/overlay'
import IVCookies from './routes/imperial-vault/cookies'
import IVAlerts from './routes/imperial-vault/alerts'
import IVFacts from './routes/imperial-vault/facts'
import IVSandbox from './routes/imperial-vault/sandbox'
import IVTerminal from './routes/imperial-vault/terminal'
import IVViralScore from './routes/imperial-vault/viral-score'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'agents', element: <Agents /> },
      { path: 'chat', element: <Chat /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'browser', element: <Browser /> },
      { path: 'dev', element: <DevPage /> },
      { path: 'dev/approvals', element: <DevApprovals /> },
      { path: 'memory', element: <Memory /> },
      { path: 'skills', element: <Skills /> },
      { path: 'monitoring', element: <Monitoring /> },
      { path: 'pipelines', element: <Pipelines /> },
      { path: 'sentinel', element: <Sentinel /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings/providers', element: <ProvidersSettings /> },
      {
        path: 'imperial-vault',
        element: <ImperialVaultLayout />,
        children: [
          { index: true, element: <ImperialVault /> },
          { path: 'pipeline', element: <IVPipeline /> },
          { path: 'calendar', element: <IVCalendar /> },
          { path: 'intel', element: <IVIntel /> },
          { path: 'intelligence', element: <IVIntelligence /> },
          { path: 'footage', element: <IVFootage /> },
          { path: 'music', element: <IVMusic /> },
          { path: 'discord', element: <IVDiscord /> },
          { path: 'overlay', element: <IVOverlay /> },
          { path: 'cookies', element: <IVCookies /> },
          { path: 'alerts', element: <IVAlerts /> },
          { path: 'facts', element: <IVFacts /> },
          { path: 'sandbox', element: <IVSandbox /> },
          { path: 'terminal', element: <IVTerminal /> },
          { path: 'viral-score', element: <IVViralScore /> },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

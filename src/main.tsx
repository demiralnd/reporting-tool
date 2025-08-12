import React from 'react'
import ReactDOM from 'react-dom/client'
import AdReportingTool from './AdReportingTool'
import ErrorBoundary from './ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AdReportingTool />
    </ErrorBoundary>
  </React.StrictMode>,
)
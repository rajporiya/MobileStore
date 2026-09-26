import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { store } from './store/store.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              boxShadow: '0 10px 24px -10px rgba(79, 70, 229, 0.25)',
            },
            success: {
              iconTheme: { primary: '#4f46e5', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)

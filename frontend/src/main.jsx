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
              background: '#fdf8f0',
              color: '#3d2b1f',
              border: '1px solid #e2c08a',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#8B5E3C', secondary: '#fdf8f0' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fdf8f0' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)

// Program entry point that renders the React App component into the DOM.

import { jsx as _jsx } from 'react/jsx-runtime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

// Create a root attached to the #root element and render the App within StrictMode.
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }))

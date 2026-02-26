import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../index.css'

// 将 React 暴露给 Mulby 插件框架
window.React = React
window.ReactDOM = ReactDOM

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

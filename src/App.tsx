import React from 'react';
import { Route, Routes } from "react-router-dom"
import Home from './pages/Home';
import "./styles.css"
import Pochita from './pages/Pochita';

function App() {
  return (
    <div className='main-container'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pochita" element={<Pochita />} />
      </Routes>
    </div>
  )
}

export default App;

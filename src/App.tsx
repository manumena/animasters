import React from 'react';
import logo from './pocha.png';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Pochita appreciation page</p>
        <a
          className="App-link"
          href="https://chainsaw-man.fandom.com/wiki/Pochita"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
      </header>
    </div>
  );
}

export default App;

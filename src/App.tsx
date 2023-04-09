import React from 'react';
import logo from './pocha.png';
import './App.css';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <audio 
          controls={true}
          loop={true}
          src="https://firebasestorage.googleapis.com/v0/b/guess-the-anime-a6470.appspot.com/o/kick_back.mp3?alt=media&token=2b9963d9-a151-429e-aad7-217f860ef5e1"
        />
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

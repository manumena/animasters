import logo from '../assets/pocha.png'

export default function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <audio 
          controls={true}
          loop={true}
          src="https://dszqiegiplfnrnovpqvn.supabase.co/storage/v1/object/public/animasters/Chainsawman/kick_back.mp3"
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
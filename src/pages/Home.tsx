import PlayersNamesForm from "../components/PlayersNamesForm";

export default function Home() {
  return (
    <div className="home-container">
      <h1>Otaku challenge</h1>
      <p>Immerse yourself in the captivating world of anime and test your knowledge by trying to guess the anime series from its opening theme</p>
      <PlayersNamesForm/> 
    </div>
  );
}
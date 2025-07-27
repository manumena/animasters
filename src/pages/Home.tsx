import MainScreen from "../components/MainScreen";
import MatchScreen from "../components/MatchScreen";
import SettingsScreen from "../components/SettingsScreen";
import { useGameStore, ViewState } from "../stores/useGameStore";

export default function Home() {
  const {
    view,
    players,
    songs,
    songsPerRound,
    startGame,
    setView,
    backFromSettings,
  } = useGameStore();

  return (
    <>
      {view === ViewState.MAIN && (
        <MainScreen
          startCallback={startGame}
          settingsCallback={() => setView(ViewState.SETTINGS)}
        />
      )}
      {view === ViewState.PLAYING && (
        <MatchScreen
          players={players}
          matchSongs={songs}
          songsPerRound={songsPerRound}
        />
      )}
      {view === ViewState.SETTINGS && (
        <SettingsScreen
          songsPerRound={songsPerRound}
          backCallback={backFromSettings}
        />
      )}
    </>
  );
}
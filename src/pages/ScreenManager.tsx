import MainScreen from "../components/MainScreen";
import MatchScreen from "../components/MatchScreen";
import SettingsScreen from "../components/SettingsScreen";
import { useGameStore, ViewState } from "../stores/useGameStore";

export default function ScreenManager() {

  const { view } = useGameStore()

  return (
    <>
      {view === ViewState.MAIN && <MainScreen/>}
      {view === ViewState.PLAYING && <MatchScreen/>}
      {view === ViewState.SETTINGS && <SettingsScreen/>}
    </>
  );
}
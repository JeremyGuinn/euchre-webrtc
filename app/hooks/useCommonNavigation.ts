import { useNavigate } from "react-router";

export function useCommonNavigation() {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const goToHost = () => navigate("/host");
  const goToJoin = (gameCode: string) => navigate(`/join/${gameCode}`);
  const goToLobby = (gameId: string) => navigate(`/lobby/${gameId}`);
  const goToGame = (gameId: string) => navigate(`/game/${gameId}`);

  return {
    goHome,
    goToHost,
    goToJoin,
    goToLobby,
    goToGame,
    navigate // expose the raw navigate for custom cases
  };
}

export default useCommonNavigation;

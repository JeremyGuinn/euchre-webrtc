import { useCallback, useEffect, useRef } from 'react';

import { createMessageHandlers } from '~/network/handlers';
import { GameNetworkService } from '~/services/networkService';
import type { GameState } from '~/types/game';
import type { MessageHandler } from '~/types/handlers';
import type { GameMessage } from '~/types/messages';
import type { GameAction } from '~/utils/gameState';
import type { ConnectionStatus, PeerMessageHandler } from '~/utils/networking';

// Cooldown period to prevent rapid reconnection attempts (5 seconds)
const RECONNECTION_COOLDOWN_MS = 5000;

export function useNetworkHandlers(
  networkService: GameNetworkService,
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  dispatch: React.Dispatch<GameAction>,
  broadcastGameState: () => void,
  handleKicked: (message: string) => void,
  setConnectionStatus?: (status: ConnectionStatus) => void,
  setMyPlayerId?: (id: string) => void,
  setIsHost?: (isHost: boolean) => void,
  pollForHostReconnection?: () => Promise<boolean>
) {
  // Track last reconnection attempt to prevent rapid-fire attempts
  const lastReconnectionAttempt = useRef<number>(0);
  // Track if a reconnection is currently in progress
  const isReconnecting = useRef<boolean>(false);

  const stateRef = useRef({
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    broadcastGameState,
    handleKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
  });

  stateRef.current = {
    gameState,
    myPlayerId,
    isHost,
    dispatch,
    broadcastGameState,
    handleKicked,
    setConnectionStatus,
    setMyPlayerId,
    setIsHost,
  };

  const handleWithContext = useCallback(
    <T extends GameMessage>(
      handler: MessageHandler<T>
    ): PeerMessageHandler<T> => {
      return (message: T, senderId: string) => {
        const networkManager = networkService.getNetworkManager();
        if (!networkManager) return;

        handler(message, senderId, {
          gameState: stateRef.current.gameState,
          myPlayerId: stateRef.current.myPlayerId,
          isHost: stateRef.current.isHost,
          dispatch: stateRef.current.dispatch,
          networkManager,
          broadcastGameState: stateRef.current.broadcastGameState,
          handleKicked: stateRef.current.handleKicked,
          setConnectionStatus:
            stateRef.current.setConnectionStatus || (() => {}),
          setMyPlayerId: stateRef.current.setMyPlayerId || (() => {}),
          setIsHost: stateRef.current.setIsHost || (() => {}),
        });
      };
    },
    [networkService]
  );

  useEffect(() => {
    networkService.setStatusChangeHandler(status => {
      stateRef.current.setConnectionStatus?.(status);
    });

    networkService.setConnectionChangeHandler((peerId, connected) => {
      const { gameState, isHost, setConnectionStatus } = stateRef.current;

      stateRef.current.dispatch({
        type: 'UPDATE_PLAYER_CONNECTION',
        payload: { playerId: peerId, isConnected: connected },
      });

      // If we're a client and the host disconnects, start polling for reconnection
      // BUT only if this wasn't an intentional disconnect
      if (!isHost && !connected && pollForHostReconnection) {
        const hostPlayer = gameState.players.find(p => p.isHost);
        if (hostPlayer && hostPlayer.id === peerId) {
          // Check if a reconnection is already in progress
          if (isReconnecting.current) {
            return;
          }

          // Check cooldown to prevent rapid fire reconnection attempts
          const now = Date.now();
          if (
            now - lastReconnectionAttempt.current <
            RECONNECTION_COOLDOWN_MS
          ) {
            return;
          }

          lastReconnectionAttempt.current = now;
          isReconnecting.current = true;

          // Only attempt reconnection if we're in a valid game phase
          const validReconnectionPhases = [
            'lobby',
            'dealer_selection',
            'team_summary',
            'dealing_animation',
            'farmers_hand_check',
            'farmers_hand_swap',
            'bidding_round1',
            'bidding_round2',
            'dealer_discard',
            'playing',
            'trick_complete',
            'hand_complete',
          ];

          if (validReconnectionPhases.includes(gameState.phase)) {
            setConnectionStatus?.('reconnecting');

            pollForHostReconnection()
              .then(() => {})
              .catch(() => {
                setConnectionStatus?.('error');
              })
              .finally(() => {
                isReconnecting.current = false;
              });
          } else {
            setConnectionStatus?.('disconnected');
            isReconnecting.current = false;
          }
        }
      }
    });
  }, [networkService, pollForHostReconnection]);

  useEffect(() => {
    const networkManager = networkService.getNetworkManager();
    if (!networkManager) return;

    const messageHandlers = createMessageHandlers();

    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      networkService.registerMessageHandler(
        messageType,
        handleWithContext(handler as MessageHandler<GameMessage>)
      );
    });
  }, [networkService, handleWithContext]);
}

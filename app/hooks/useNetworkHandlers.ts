import { useCallback, useEffect, useRef } from 'react';

import { createMessageHandlers } from '~/network/handlers';
import { createScopedLogger } from '~/services/loggingService';
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
  const logger = createScopedLogger('useNetworkHandlers');

  // Track last reconnection attempt to prevent rapid-fire attempts
  const lastReconnectionAttempt = useRef<number>(0);
  // Track if a reconnection is currently in progress
  const isReconnecting = useRef<boolean>(false);

  logger.debug('Network handlers initialized', {
    myPlayerId,
    isHost,
    gamePhase: gameState.phase,
    playerCount: gameState.players.length,
  });

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
        logger.debug('Processing message with context', {
          messageType: message.type,
          messageId: message.messageId,
          senderId,
          gamePhase: stateRef.current.gameState.phase,
          myPlayerId: stateRef.current.myPlayerId,
          isHost: stateRef.current.isHost,
        });

        const networkManager = networkService.getNetworkManager();
        if (!networkManager) {
          logger.error('Network manager not available for message handling', {
            messageType: message.type,
            messageId: message.messageId,
            senderId,
          });
          return;
        }

        try {
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

          logger.debug('Message handled successfully', {
            messageType: message.type,
            messageId: message.messageId,
            senderId,
          });
        } catch (error) {
          logger.error('Error handling message', {
            messageType: message.type,
            messageId: message.messageId,
            senderId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      };
    },
    [networkService, logger]
  );

  useEffect(() => {
    logger.debug('Setting up network event handlers');

    networkService.setStatusChangeHandler(status => {
      logger.info('Network status changed', { status });
      stateRef.current.setConnectionStatus?.(status);
    });

    networkService.setConnectionChangeHandler((peerId, connected) => {
      const { gameState, isHost, setConnectionStatus } = stateRef.current;

      logger.info('Peer connection changed', {
        peerId,
        connected,
        isHost,
        gamePhase: gameState.phase,
      });

      stateRef.current.dispatch({
        type: 'UPDATE_PLAYER_CONNECTION',
        payload: { playerId: peerId, isConnected: connected },
      });

      // If we're a client and the host disconnects, start polling for reconnection
      // BUT only if this wasn't an intentional disconnect
      if (!isHost && !connected && pollForHostReconnection) {
        const hostPlayer = gameState.players.find(p => p.isHost);
        if (hostPlayer && hostPlayer.id === peerId) {
          logger.warn('Host disconnected, evaluating reconnection', {
            hostPlayerId: peerId,
            isReconnecting: isReconnecting.current,
          });

          // Check if a reconnection is already in progress
          if (isReconnecting.current) {
            logger.debug('Reconnection already in progress, skipping');
            return;
          }

          // Check cooldown to prevent rapid fire reconnection attempts
          const now = Date.now();
          const timeSinceLastAttempt = now - lastReconnectionAttempt.current;
          if (timeSinceLastAttempt < RECONNECTION_COOLDOWN_MS) {
            logger.debug('Reconnection cooldown active, skipping', {
              timeSinceLastAttempt,
              cooldownMs: RECONNECTION_COOLDOWN_MS,
            });
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
            logger.info('Starting host reconnection polling', {
              gamePhase: gameState.phase,
              hostPlayerId: peerId,
            });

            setConnectionStatus?.('reconnecting');

            pollForHostReconnection()
              .then(success => {
                if (success) {
                  logger.info('Host reconnection polling successful');
                } else {
                  logger.warn('Host reconnection polling failed');
                }
              })
              .catch(error => {
                logger.error('Host reconnection polling error', {
                  error: error instanceof Error ? error.message : String(error),
                });
                setConnectionStatus?.('error');
              })
              .finally(() => {
                logger.debug('Host reconnection polling completed');
                isReconnecting.current = false;
              });
          } else {
            logger.warn('Cannot reconnect in current game phase', {
              gamePhase: gameState.phase,
              validPhases: validReconnectionPhases,
            });
            setConnectionStatus?.('disconnected');
            isReconnecting.current = false;
          }
        }
      }
    });

    logger.debug('Network event handlers setup complete');
  }, [networkService, pollForHostReconnection, logger]);

  useEffect(() => {
    const networkManager = networkService.getNetworkManager();
    if (!networkManager) {
      logger.warn(
        'Network manager not available for message handler registration'
      );
      return;
    }

    logger.debug('Registering message handlers');
    const messageHandlers = createMessageHandlers();
    const handlerCount = Object.keys(messageHandlers).length;

    logger.info('Setting up message handlers', { handlerCount });

    Object.entries(messageHandlers).forEach(([messageType, handler]) => {
      logger.debug('Registering message handler', { messageType });
      networkService.registerMessageHandler(
        messageType,
        handleWithContext(handler as MessageHandler<GameMessage>)
      );
    });

    logger.info('Message handlers registration complete', {
      handlerCount,
      messageTypes: Object.keys(messageHandlers),
    });
  }, [networkService, handleWithContext, logger]);
}

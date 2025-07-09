import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Bid,
  Card,
  GameOptions,
  GameState,
  Player,
  PublicGameState,
  Trick,
} from '~/types/game';
import {
  createDeck,
  dealHands,
  findFirstBlackJackDealer,
  getEffectiveSuit,
  getWinningCard,
  isFarmersHand,
  performFarmersHandSwap,
  selectDealerAndTeams,
  selectDealerOnly,
} from '~/utils/gameLogic';

// Helper functions
function getNextPlayer(currentPlayerId: string, players: Player[]): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

function getNextPlayerWithAlone(
  currentPlayerId: string,
  players: Player[],
  maker?: { playerId: string; teamId: 0 | 1; alone: boolean }
): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) return players[0]?.id || '';

  // If someone is going alone, skip their teammate
  if (maker?.alone) {
    const makerPlayer = players.find(p => p.id === maker.playerId);
    if (makerPlayer) {
      const teammateId = players.find(
        p => p.teamId === makerPlayer.teamId && p.id !== makerPlayer.id
      )?.id;

      // Find next player, skipping the teammate
      let nextIndex = (currentIndex + 1) % players.length;
      let nextPlayer = players[nextIndex];

      // If the next player is the teammate, skip them
      if (nextPlayer.id === teammateId) {
        nextIndex = (nextIndex + 1) % players.length;
        nextPlayer = players[nextIndex];
      }

      return nextPlayer.id;
    }
  }

  // Normal turn order
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

function getExpectedTrickSize(maker?: { playerId: string; teamId: 0 | 1; alone: boolean }): number {
  // If someone is going alone, only 3 players participate
  return maker?.alone ? 3 : 4;
}

function getNextDealer(currentDealerId: string, players: Player[]): string {
  return getNextPlayer(currentDealerId, players);
}

function getTeamId(position: number): 0 | 1 {
  return (position % 2) as 0 | 1;
}

function calculateHandScore(
  tricks: Trick[],
  players: Player[],
  makingTeam: 0 | 1,
  alone: boolean
): { team0: number; team1: number } {
  const makingTeamTricks = tricks.filter(trick => {
    if (!trick.winnerId) return false;
    const winner = players.find(p => p.id === trick.winnerId);
    return winner?.teamId === makingTeam;
  }).length;

  const scores = { team0: 0, team1: 0 };

  if (makingTeamTricks === 5) {
    // Made all 5 tricks
    scores[`team${makingTeam}`] = alone ? 4 : 2;
  } else if (makingTeamTricks >= 3) {
    // Made the bid (3 or 4 tricks)
    scores[`team${makingTeam}`] = 1;
  } else {
    // Failed to make bid - opposing team gets 2 points
    const opposingTeam = makingTeam === 0 ? 1 : 0;
    scores[`team${opposingTeam}`] = 2;
  }

  return scores;
}

const initialGameState: GameState = {
  id: '',
  players: [],
  phase: 'lobby',
  options: {
    teamSelection: 'predetermined',
    dealerSelection: 'random_cards',
    allowReneging: false,
    screwTheDealer: false,
    farmersHand: false,
  },
  currentDealerId: '',
  deck: [],
  hands: {},
  bids: [],
  completedTricks: [],
  scores: { team0: 0, team1: 0 },
  handScores: { team0: 0, team1: 0 },
  teamNames: { team0: 'Team 1', team1: 'Team 2' },
};

interface GameStore extends GameState {
  // Game initialization actions
  initGame: (hostId: string, gameId: string, gameCode?: string) => void;
  restoreGameState: (gameState: GameState) => void;
  syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => void;

  // Player management actions
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  reconnectPlayer: (oldPlayerId: string, newPlayerId: string, playerName: string) => void;
  renamePlayer: (playerId: string, newName: string) => void;
  kickPlayer: (playerId: string) => void;
  movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => void;

  // Team management actions
  renameTeam: (teamId: 0 | 1, newName: string) => void;

  // Game options actions
  updateGameOptions: (options: GameOptions) => void;

  // Game flow actions
  startGame: () => void;
  selectDealer: () => void;
  drawDealerCard: (playerId: string, card: Card) => void;
  dealerCardDealt: (playerId: string, card: Card, cardIndex: number, isBlackJack: boolean) => void;
  completeBlackjackDealerSelection: () => void;
  proceedToDealing: () => void;
  dealCards: () => void;

  // Farmer's hand actions
  farmersHandDetected: (playerId: string) => void;
  farmersHandSwap: (playerId: string, cardsToSwap: Card[]) => void;
  farmersHandDeclined: (playerId: string) => void;

  // Bidding actions
  placeBid: (bid: Bid) => void;
  dealerDiscard: (card: Card) => void;
  setTrump: (trump: Card['suit'], makerId: string, alone?: boolean) => void;

  // Playing actions
  playCard: (card: Card, playerId: string) => void;
  completeTrick: () => void;
  completeHand: () => void;
  nextHand: () => void;

  // Utility actions
  setCurrentPlayer: (playerId: string) => void;
  setPhase: (phase: GameState['phase']) => void;

  // Utility functions
  createPublicGameState: (forPlayerId?: string) => PublicGameState;
  isDealerScrewed: () => boolean;
}

export type { GameStore };

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialGameState,

    // Game initialization actions
    initGame: (hostId: string, gameId: string, gameCode?: string) => {
      set({
        ...initialGameState,
        id: gameId,
        gameCode,
        players: [
          {
            id: hostId,
            name: 'Host',
            isHost: true,
            isConnected: true,
            position: 0,
            teamId: 0,
          },
        ],
        currentDealerId: hostId,
      });
    },

    restoreGameState: (gameState: GameState) => {
      set(gameState);
    },

    syncState: (gameState: PublicGameState, playerHand?: Card[], receivingPlayerId?: string) => {
      set({
        ...get(),
        id: gameState.id,
        players: gameState.players,
        teamNames: gameState.teamNames,
        phase: gameState.phase,
        options: gameState.options,
        currentDealerId: gameState.currentDealerId,
        currentPlayerId: gameState.currentPlayerId,
        trump: gameState.trump,
        kitty: gameState.kitty,
        turnedDownSuit: gameState.turnedDownSuit,
        bids: gameState.bids,
        currentTrick: gameState.currentTrick,
        completedTricks: gameState.completedTricks,
        scores: gameState.scores,
        handScores: gameState.handScores,
        maker: gameState.maker,
        dealerSelectionCards: gameState.dealerSelectionCards,
        hands: playerHand && receivingPlayerId ? { [receivingPlayerId]: playerHand } : {},
        deck: gameState.deck,
        farmersHandPlayer: gameState.farmersHandPlayer,
      });
    },

    // Player management actions
    addPlayer: (player: Player) => {
      const { players } = get();

      // Find the first available position (0-3)
      const occupiedPositions = new Set(players.map(p => p.position));
      const availablePosition = ([0, 1, 2, 3] as const).find(pos => !occupiedPositions.has(pos));

      if (availablePosition === undefined) {
        return; // Game is full
      }

      const newPlayer: Player = {
        ...player,
        position: availablePosition,
        teamId: getTeamId(availablePosition),
      };

      set(state => ({
        players: [...state.players, newPlayer],
      }));
    },

    removePlayer: (playerId: string) => {
      set(state => ({
        players: state.players.filter(p => p.id !== playerId),
      }));
    },

    updatePlayerConnection: (playerId: string, isConnected: boolean) => {
      set(state => ({
        players: state.players.map(p => (p.id === playerId ? { ...p, isConnected } : p)),
      }));
    },

    reconnectPlayer: (oldPlayerId: string, newPlayerId: string, playerName: string) => {
      const state = get();

      // Find the player to reconnect
      const playerToReconnect = state.players.find(p => p.id === oldPlayerId);
      if (!playerToReconnect) {
        return; // Player not found
      }

      // Update the player ID and mark as connected
      const updatedPlayer: Player = {
        ...playerToReconnect,
        id: newPlayerId,
        name: playerName,
        isConnected: true,
      };

      // Update all references to the old player ID throughout the game state
      const newHands: Record<string, Card[]> = { ...state.hands };
      if (state.hands[oldPlayerId]) {
        newHands[newPlayerId] = state.hands[oldPlayerId];
        delete newHands[oldPlayerId];
      }

      const newDealerSelectionCards = state.dealerSelectionCards
        ? { ...state.dealerSelectionCards }
        : undefined;
      if (newDealerSelectionCards && state.dealerSelectionCards?.[oldPlayerId]) {
        newDealerSelectionCards[newPlayerId] = state.dealerSelectionCards[oldPlayerId];
        delete newDealerSelectionCards[oldPlayerId];
      }

      set({
        players: state.players.map(p => (p.id === oldPlayerId ? updatedPlayer : p)),
        // Update current dealer if it was the reconnecting player
        currentDealerId:
          state.currentDealerId === oldPlayerId ? newPlayerId : state.currentDealerId,
        // Update current player if it was the reconnecting player
        currentPlayerId:
          state.currentPlayerId === oldPlayerId ? newPlayerId : state.currentPlayerId,
        // Update farmer's hand player if it was the reconnecting player
        farmersHandPlayer:
          state.farmersHandPlayer === oldPlayerId ? newPlayerId : state.farmersHandPlayer,
        // Update hands mapping
        hands: newHands,
        // Update bids to reference new player ID
        bids: state.bids.map(bid =>
          bid.playerId === oldPlayerId ? { ...bid, playerId: newPlayerId } : bid
        ),
        // Update maker if it was the reconnecting player
        maker:
          state.maker?.playerId === oldPlayerId
            ? { ...state.maker, playerId: newPlayerId }
            : state.maker,
        // Update current trick if the reconnecting player was involved
        currentTrick: state.currentTrick
          ? {
              ...state.currentTrick,
              leaderId:
                state.currentTrick.leaderId === oldPlayerId
                  ? newPlayerId
                  : state.currentTrick.leaderId,
              winnerId:
                state.currentTrick.winnerId === oldPlayerId
                  ? newPlayerId
                  : state.currentTrick.winnerId,
              cards: state.currentTrick.cards.map(card =>
                card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
              ),
            }
          : state.currentTrick,
        // Update completed tricks
        completedTricks: state.completedTricks.map(trick => ({
          ...trick,
          leaderId: trick.leaderId === oldPlayerId ? newPlayerId : trick.leaderId,
          winnerId: trick.winnerId === oldPlayerId ? newPlayerId : trick.winnerId,
          cards: trick.cards.map(card =>
            card.playerId === oldPlayerId ? { ...card, playerId: newPlayerId } : card
          ),
        })),
        // Update dealer selection cards if they exist
        dealerSelectionCards: newDealerSelectionCards,
      });
    },

    renamePlayer: (playerId: string, newName: string) => {
      set(state => ({
        players: state.players.map(p => (p.id === playerId ? { ...p, name: newName } : p)),
      }));
    },

    kickPlayer: (playerId: string) => {
      set(state => ({
        players: state.players.filter(p => p.id !== playerId),
      }));
    },

    movePlayer: (playerId: string, newPosition: 0 | 1 | 2 | 3) => {
      const { players } = get();

      const playerToMove = players.find(p => p.id === playerId);
      if (!playerToMove) return;

      // Find if there's already a player at the target position
      const playerAtTarget = players.find(p => p.position === newPosition);

      const updatedPlayers = players.map(p => {
        if (p.id === playerId) {
          // Move the player to new position and update team
          return {
            ...p,
            position: newPosition,
            teamId: (newPosition % 2) as 0 | 1,
          };
        } else if (playerAtTarget && p.id === playerAtTarget.id) {
          // Swap with the player at target position
          return {
            ...p,
            position: playerToMove.position,
            teamId: (playerToMove.position % 2) as 0 | 1,
          };
        }
        return p;
      });

      set({ players: updatedPlayers });
    },

    // Team management actions
    renameTeam: (teamId: 0 | 1, newName: string) => {
      set(state => ({
        teamNames: {
          ...state.teamNames,
          [`team${teamId}`]: newName,
        },
      }));
    },

    // Game options actions
    updateGameOptions: (options: GameOptions) => {
      const { phase } = get();

      // Only allow changing options in lobby phase
      if (phase !== 'lobby') {
        return;
      }

      set({ options });
    },

    // Game flow actions
    startGame: () => {
      const { players, options } = get();

      if (players.length !== 4) {
        return; // Need exactly 4 players
      }

      // For predetermined dealer, skip dealer selection and go directly to team summary
      if (options.dealerSelection === 'predetermined_first_dealer') {
        const predeterminedDealerId = options.predeterminedFirstDealerId;

        if (!predeterminedDealerId) {
          return;
        }

        // Validate the dealer exists
        const dealer = players.find(p => p.id === predeterminedDealerId);
        if (!dealer) {
          return;
        }

        // Arrange players so the predetermined dealer is at position 0
        const arrangedPlayers: Player[] = [];
        const dealerOriginalPosition = dealer.position;

        // Rotate positions so dealer is at position 0
        players.forEach(player => {
          const newPosition = ((player.position - dealerOriginalPosition + 4) % 4) as 0 | 1 | 2 | 3;
          arrangedPlayers[newPosition] = {
            ...player,
            position: newPosition,
            teamId: getTeamId(newPosition),
          };
        });

        // Set the dealer and move to team summary phase
        set({
          players: arrangedPlayers,
          currentDealerId: predeterminedDealerId,
          phase: 'team_summary',
          deck: createDeck(),
        });
        return;
      }

      // For other dealer selection methods, go to dealer selection phase
      set({ phase: 'dealer_selection' });
    },

    selectDealer: () => {
      const { options } = get();

      // For predetermined dealer, skip dealer selection and go directly to dealing
      if (options.dealerSelection === 'predetermined_first_dealer') {
        const predeterminedDealerId = options.predeterminedFirstDealerId;

        if (!predeterminedDealerId) {
          return;
        }

        // Validate the dealer exists
        const dealer = get().players.find(p => p.id === predeterminedDealerId);
        if (!dealer) {
          return;
        }

        // Set the dealer and move to team summary phase
        set({
          currentDealerId: predeterminedDealerId,
          phase: 'team_summary',
          deck: createDeck(),
        });
        return;
      }

      // Create a shuffled deck for card drawing/dealing
      const deck = createDeck();

      // Initialize dealer selection state based on method
      if (options.dealerSelection === 'first_black_jack') {
        set({
          deck,
          firstBlackJackDealing: {
            currentPlayerIndex: 0,
            currentCardIndex: 0,
            dealtCards: [],
          },
        });
      } else {
        // Random cards method
        set({
          deck,
          dealerSelectionCards: {},
        });
      }
    },

    drawDealerCard: (playerId: string, card: Card) => {
      const { dealerSelectionCards, players, options } = get();

      const newDealerSelectionCards = {
        ...dealerSelectionCards,
        [playerId]: card,
      };

      // Check if all 4 players have drawn cards
      if (Object.keys(newDealerSelectionCards).length === 4) {
        // Automatically complete dealer selection
        let dealer: Player;
        let arrangedPlayers: Player[];

        if (options.teamSelection === 'random_cards') {
          // Use cards to determine both dealer and teams
          const result = selectDealerAndTeams(players, newDealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        } else {
          // Use cards only for dealer selection, keep predetermined teams
          const result = selectDealerOnly(players, newDealerSelectionCards);
          dealer = result.dealer;
          arrangedPlayers = result.arrangedPlayers;
        }

        set({
          players: arrangedPlayers,
          currentDealerId: dealer.id,
          dealerSelectionCards: newDealerSelectionCards, // displayed in the team_summary display
          phase: 'team_summary',
        });
      } else {
        set({ dealerSelectionCards: newDealerSelectionCards });
      }
    },

    dealerCardDealt: (playerId: string, card: Card, cardIndex: number, isBlackJack: boolean) => {
      const { firstBlackJackDealing, players } = get();

      // Add the dealt card to the dealing state
      const currentDealing = firstBlackJackDealing || {
        currentPlayerIndex: 0,
        currentCardIndex: 0,
        dealtCards: [],
      };

      const updatedDealing = {
        currentPlayerIndex: (currentDealing.currentPlayerIndex + 1) % players.length,
        currentCardIndex: cardIndex + 1,
        dealtCards: [...currentDealing.dealtCards, { playerId, card }],
        blackJackFound: isBlackJack ? { playerId, card } : currentDealing.blackJackFound,
      };

      set({ firstBlackJackDealing: updatedDealing });
    },

    completeBlackjackDealerSelection: () => {
      const { firstBlackJackDealing, deck, players } = get();

      if (!firstBlackJackDealing?.blackJackFound) {
        return; // No black jack found yet
      }

      const { dealer, arrangedPlayers } = findFirstBlackJackDealer(deck, players);

      set({
        players: arrangedPlayers,
        currentDealerId: dealer.id,
        phase: 'team_summary',
      });
    },

    proceedToDealing: () => {
      set({
        phase: 'dealing_animation',
        dealerSelectionCards: undefined,
      });
    },

    dealCards: () => {
      const { players, currentDealerId, options } = get();

      const deck = createDeck();
      const { hands, kitty, remainingDeck } = dealHands(deck);

      const playerHands: Record<string, Card[]> = {};
      players.forEach((player, index) => {
        playerHands[player.id] = hands[index];
      });

      // Check for farmer's hand if the option is enabled
      let nextPhase: GameState['phase'] = 'bidding_round1';
      let farmersHandPlayer: string | undefined = undefined;
      let currentPlayerId = getNextPlayer(currentDealerId, players);

      if (options.farmersHand) {
        // Find the first player with a farmer's hand
        const playerWithFarmersHand = players.find(player => {
          const hand = playerHands[player.id];
          return hand && isFarmersHand(hand);
        });

        if (playerWithFarmersHand) {
          nextPhase = 'farmers_hand_swap';
          farmersHandPlayer = playerWithFarmersHand.id;
          currentPlayerId = playerWithFarmersHand.id;
        }
      }

      set({
        deck: remainingDeck,
        hands: playerHands,
        kitty,
        phase: nextPhase,
        bids: [],
        currentPlayerId,
        trump: undefined,
        maker: undefined,
        turnedDownSuit: undefined,
        farmersHandPlayer,
      });
    },

    // Farmer's hand actions
    farmersHandDetected: (playerId: string) => {
      set({
        phase: 'farmers_hand_swap',
        farmersHandPlayer: playerId,
        currentPlayerId: playerId,
      });
    },

    farmersHandSwap: (playerId: string, cardsToSwap: Card[]) => {
      const { kitty, farmersHandPlayer, hands, deck, currentDealerId, players } = get();

      if (!kitty || !farmersHandPlayer || farmersHandPlayer !== playerId) {
        return;
      }

      const playerHand = hands[playerId];
      if (!playerHand) {
        return;
      }

      // Perform the swap
      const { newHand, newKitty, newRemainingDeck } = performFarmersHandSwap(
        playerHand,
        cardsToSwap,
        kitty,
        deck
      );

      set({
        hands: {
          ...hands,
          [playerId]: newHand,
        },
        kitty: newKitty,
        deck: newRemainingDeck,
        phase: 'bidding_round1',
        currentPlayerId: getNextPlayer(currentDealerId, players),
        farmersHandPlayer: undefined,
      });
    },

    farmersHandDeclined: (playerId: string) => {
      const { farmersHandPlayer, currentDealerId, players } = get();

      if (!farmersHandPlayer || farmersHandPlayer !== playerId) {
        return;
      }

      set({
        phase: 'bidding_round1',
        currentPlayerId: getNextPlayer(currentDealerId, players),
        farmersHandPlayer: undefined,
      });
    },

    // Bidding actions
    placeBid: (bid: Bid) => {
      const state = get();
      const newBids = [...state.bids, bid];

      let newPhase = state.phase;
      let trump = state.trump;
      let maker = state.maker;
      let currentPlayer = state.currentPlayerId;
      let turnedDownSuit = state.turnedDownSuit;
      let newHands = state.hands;

      if (state.phase === 'bidding_round1') {
        // Round 1: Can only order up/assist/take up the kitty suit, or pass
        if (bid.suit !== 'pass') {
          // Someone ordered up/assisted/took up the kitty suit
          trump = state.kitty!.suit;
          const player = state.players.find(p => p.id === bid.playerId);
          maker = {
            playerId: bid.playerId,
            teamId: player?.teamId || 0,
            alone: bid.alone || false,
          };

          if (newHands[state.currentDealerId]) {
            newHands = {
              ...newHands,
              [state.currentDealerId]: [...newHands[state.currentDealerId], state.kitty!],
            };
          }

          // Check if dealer is sitting out due to going alone
          const dealerPlayer = state.players.find(p => p.id === state.currentDealerId);
          const isDealerSittingOut =
            maker.alone &&
            maker.playerId !== state.currentDealerId &&
            dealerPlayer?.teamId === maker.teamId;

          if (isDealerSittingOut) {
            // Skip dealer discard phase and go straight to playing
            newPhase = 'playing';
            currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
          } else {
            // Go to dealer discard phase
            newPhase = 'dealer_discard';
            currentPlayer = state.currentDealerId;
          }
        } else {
          // Player passed, check if round 1 is complete
          const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
          const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

          if (currentPlayerIndex === dealerIndex) {
            // Dealer passed, start round 2
            newPhase = 'bidding_round2';
            turnedDownSuit = state.kitty!.suit;
            currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
          } else {
            // Continue round 1
            currentPlayer = getNextPlayerWithAlone(bid.playerId, state.players, maker);
          }
        }
      } else if (state.phase === 'bidding_round2') {
        // Round 2: Can call any suit except the turned down suit, or pass
        if (bid.suit !== 'pass') {
          // Someone called a suit
          trump = bid.suit as Card['suit'];
          const player = state.players.find(p => p.id === bid.playerId);
          maker = {
            playerId: bid.playerId,
            teamId: player?.teamId || 0,
            alone: bid.alone || false,
          };
          newPhase = 'playing';
          currentPlayer = getNextPlayerWithAlone(state.currentDealerId, state.players, maker);
        } else {
          // Player passed, check if round 2 is complete
          const currentPlayerIndex = state.players.findIndex(p => p.id === bid.playerId);
          const dealerIndex = state.players.findIndex(p => p.id === state.currentDealerId);

          if (currentPlayerIndex === dealerIndex) {
            // Dealer passed in round 2
            if (state.options.screwTheDealer) {
              // With screw the dealer, dealer cannot pass in round 2
              // This should not happen in the UI, but handle it gracefully
              return; // Don't process the bid
            } else {
              // Standard rules: All players passed both rounds, deal new hand
              newPhase = 'dealing_animation';
              currentPlayer = getNextDealer(state.currentDealerId, state.players);
            }
          } else {
            // Continue round 2
            currentPlayer = getNextPlayerWithAlone(bid.playerId, state.players, maker);
          }
        }
      }

      set({
        bids: newBids,
        phase: newPhase,
        trump,
        maker,
        turnedDownSuit,
        currentPlayerId: currentPlayer,
        currentDealerId:
          newPhase === 'dealing_animation'
            ? currentPlayer || state.currentDealerId
            : state.currentDealerId,
        hands: newPhase === 'dealing_animation' ? {} : newHands,
      });
    },

    dealerDiscard: (card: Card) => {
      const { currentDealerId, hands, players, maker } = get();

      // Remove the discarded card from dealer's hand
      const newHands = {
        ...hands,
        [currentDealerId]: hands[currentDealerId]?.filter(c => c.id !== card.id) || [],
      };

      set({
        hands: newHands,
        phase: 'playing',
        currentPlayerId: getNextPlayerWithAlone(currentDealerId, players, maker),
      });
    },

    setTrump: (trump: Card['suit'], makerId: string, alone?: boolean) => {
      const { players } = get();

      set({
        trump,
        maker: {
          playerId: makerId,
          teamId: players.find(p => p.id === makerId)?.teamId || 0,
          alone: alone || false,
        },
        phase: 'playing',
      });
    },

    // Playing actions
    playCard: (card: Card, playerId: string) => {
      const state = get();

      if (!state.currentTrick) {
        const newTrick: Trick = {
          id: crypto.randomUUID(),
          cards: [{ card, playerId }],
          leaderId: playerId,
        };

        set({
          currentTrick: newTrick,
          hands: {
            ...state.hands,
            [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
          },
          currentPlayerId: getNextPlayerWithAlone(playerId, state.players, state.maker),
        });
        return;
      }

      const updatedTrick = {
        ...state.currentTrick,
        cards: [...state.currentTrick.cards, { card, playerId }],
      };

      const newHands = {
        ...state.hands,
        [playerId]: state.hands[playerId].filter(c => c.id !== card.id),
      };

      const expectedTrickSize = getExpectedTrickSize(state.maker);

      if (updatedTrick.cards.length !== expectedTrickSize) {
        set({
          hands: newHands,
          currentTrick: updatedTrick,
          currentPlayerId: getNextPlayerWithAlone(playerId, state.players, state.maker),
        });
        return;
      }

      const leadSuit = state.trump
        ? getEffectiveSuit(updatedTrick.cards[0].card, state.trump)
        : updatedTrick.cards[0].card.suit;

      const winningPlay = getWinningCard(updatedTrick.cards, state.trump!, leadSuit);
      updatedTrick.winnerId = winningPlay.playerId;

      const newCompletedTricks = [...state.completedTricks, updatedTrick];

      if (newCompletedTricks.length !== 5) {
        set({
          hands: newHands,
          currentTrick: undefined,
          completedTricks: newCompletedTricks,
          phase: 'trick_complete',
          currentPlayerId: winningPlay.playerId,
        });
        return;
      }

      if (!state.maker) return;

      const handScores = calculateHandScore(
        newCompletedTricks,
        state.players,
        state.maker.teamId,
        state.maker.alone
      );

      const newScores = {
        team0: state.scores.team0 + handScores.team0,
        team1: state.scores.team1 + handScores.team1,
      };

      // Check for game end (first to 10 points wins)
      const gameComplete = newScores.team0 >= 10 || newScores.team1 >= 10;

      set({
        handScores,
        hands: newHands,
        currentTrick: undefined,
        completedTricks: newCompletedTricks,
        currentPlayerId: winningPlay.playerId,
        scores: newScores,
        phase: gameComplete ? 'game_complete' : 'hand_complete',
      });
    },

    completeTrick: () => {
      set({ phase: 'playing' });
    },

    completeHand: () => {
      const { currentDealerId, players, phase } = get();

      set({
        phase: 'dealing_animation',
        currentDealerId: getNextDealer(currentDealerId, players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: phase === 'game_complete' ? get().hands : {},
        currentTrick: undefined,
        turnedDownSuit: undefined,
        handScores: { team0: 0, team1: 0 },
      });
    },

    nextHand: () => {
      const { currentDealerId, players } = get();

      set({
        phase: 'dealing_animation',
        currentDealerId: getNextDealer(currentDealerId, players),
        completedTricks: [],
        trump: undefined,
        maker: undefined,
        bids: [],
        hands: {},
        currentTrick: undefined,
        turnedDownSuit: undefined,
        handScores: { team0: 0, team1: 0 },
      });
    },

    // Utility actions
    setCurrentPlayer: (playerId: string) => {
      set({ currentPlayerId: playerId });
    },

    setPhase: (phase: GameState['phase']) => {
      set({ phase });
    },

    // Utility functions
    createPublicGameState: (forPlayerId?: string): PublicGameState => {
      const state = get();

      // Create placeholder cards for the deck - clients only see placeholders for security
      const placeholderCards: Card[] = Array.from({ length: state.deck.length }, (_, index) => ({
        id: `placeholder-${index}`,
        suit: 'spades' as const,
        value: 'A' as const,
      }));

      const publicState: PublicGameState = {
        id: state.id,
        gameCode: state.gameCode,
        players: state.players,
        phase: state.phase,
        options: state.options,
        currentDealerId: state.currentDealerId,
        currentPlayerId: state.currentPlayerId,
        trump: state.trump,
        kitty: state.kitty,
        turnedDownSuit: state.turnedDownSuit,
        bids: state.bids,
        currentTrick: state.currentTrick,
        completedTricks: state.completedTricks,
        scores: state.scores,
        handScores: state.handScores,
        teamNames: state.teamNames,
        maker: state.maker,
        farmersHandPlayer: state.farmersHandPlayer,
        dealerSelectionCards: state.dealerSelectionCards,
        firstBlackJackDealing: state.firstBlackJackDealing,
        deck: placeholderCards,
      };

      // Include player's hand if specified
      if (forPlayerId && state.hands[forPlayerId]) {
        publicState.playerHand = state.hands[forPlayerId];
      }

      return publicState;
    },

    isDealerScrewed: (): boolean => {
      const state = get();

      // Only applies in round 2 with screw-the-dealer enabled
      if (state.phase !== 'bidding_round2' || !state.options.screwTheDealer) {
        return false;
      }

      // Check if current player is the dealer
      if (state.currentPlayerId !== state.currentDealerId) {
        return false;
      }

      // In round 2, the dealer is screwed if everyone else has passed
      // We need to count how many players have passed since round 2 started

      // Find where round 2 started (when the dealer passed at the end of round 1)
      const round1Passes = state.players.length; // Each player passes once in round 1
      const round2Bids = state.bids.slice(round1Passes); // Bids from round 2

      // Count how many non-dealer players have passed in round 2
      const round2Passes = round2Bids.filter(
        bid => bid.suit === 'pass' && bid.playerId !== state.currentDealerId
      ).length;

      // If all 3 other players have passed in round 2, dealer is screwed
      return round2Passes === 3;
    },
  }))
);

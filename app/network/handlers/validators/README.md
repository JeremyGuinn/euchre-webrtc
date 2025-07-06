# Validators

This directory contains validation functions organized by their purpose and scope.

## Structure

### `permissionValidators.ts`

- `validatePermissionForHost` - Ensures only hosts process client-to-host messages
- `validatePermissionForClient` - Ensures only clients process host-to-client messages

### `playerValidators.ts`

- `validatePlayerExists` - Verifies the sender is a valid player in the game
- `validatePlayerTurn` - Ensures it's the sender's turn for turn-based actions

### `gameStateValidators.ts`

- `validateGamePhase` - Factory function that validates the game is in a specific phase
- `validateGameOption` - Factory function that validates a game option has an expected value

## Usage

All validators are exported from the main index file and can be imported as:

```typescript
import {
  validatePlayerExists,
  validatePlayerTurn,
  validateGamePhase,
  validateGameOption,
} from '../validators';
```

### Factory Functions

Some validators are factory functions that return validators:

```typescript
// Create a validator that checks for lobby phase
const validateLobbyPhase = validateGamePhase('lobby');

// Create a validator that checks predetermined dealer setting
const validatePredeterminedDealer = validateGameOption(
  'dealerSelection',
  'predetermined_first_dealer'
);

// Use in handler
export const handleMyMessage = createClientToHostHandler(handleMyMessageImpl, [
  validatePlayerExists,
  validateLobbyPhase,
  validatePredeterminedDealer,
]);
```

## Validation Result

All validators return a `ValidationResult`:

```typescript
interface ValidationResult {
  isValid: boolean;
  reason?: string;
}
```

Failed validations automatically log warnings with context and prevent handler execution.

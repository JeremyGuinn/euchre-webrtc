import type { ConnectionStatus } from '~/network/networkManager';

const peerJSErrorToUserFriendlyMessage: Record<string, string> = {
  'peer-unavailable': 'The host is currently unavailable or the game does not exist.',
  'peer-disconnected': 'You have been disconnected from the game.',
  'peer-timeout': 'The connection timed out. Please try again later.',
};

export const mapToUserFriendlyError = (
  message: string,
  status: ConnectionStatus,
  error?: unknown
): string => {
  // if it's a peerjs error, we can map it to a user-friendly message
  if (isPeerJSError(error)) {
    const userFriendlyMessage = peerJSErrorToUserFriendlyMessage[error.type];
    if (userFriendlyMessage) {
      return userFriendlyMessage;
    }
  }

  return message;
};

const isPeerJSError = (error: unknown): error is { type: string } => {
  return typeof error === 'object' && error !== null && 'type' in error;
};

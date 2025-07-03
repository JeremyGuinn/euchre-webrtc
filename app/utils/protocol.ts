import { decode, encode } from '@msgpack/msgpack';

import type { GameMessage } from '../types/messages';

export class ProtocolError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export function encodeMessage(message: GameMessage): Uint8Array {
  try {
    return encode(message);
  } catch {
    throw new ProtocolError('Failed to encode message', 'ENCODE_ERROR');
  }
}

export function decodeMessage(data: Uint8Array): GameMessage {
  try {
    const decoded = decode(data);

    // Validate that the decoded object has the required structure
    if (!isValidMessage(decoded)) {
      throw new ProtocolError('Invalid message structure', 'INVALID_MESSAGE');
    }

    return decoded as GameMessage;
  } catch (error) {
    if (error instanceof ProtocolError) {
      throw error;
    }
    throw new ProtocolError('Failed to decode message', 'DECODE_ERROR');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidMessage(obj: any): obj is GameMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.messageId === 'string' &&
    obj.payload !== undefined
  );
}

export function isRecentMessage(
  message: GameMessage,
  maxAgeMs: number = 30000
): boolean {
  const now = Date.now();
  return now - message.timestamp <= maxAgeMs;
}

export function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function sanitizeMessage(message: GameMessage): GameMessage {
  // Create a clean copy to prevent prototype pollution
  return JSON.parse(JSON.stringify(message));
}

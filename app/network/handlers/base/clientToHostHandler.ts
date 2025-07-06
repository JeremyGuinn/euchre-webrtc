import type {
  ClientToHostHandler,
  HandlerContext,
  ValidationResult,
} from '~/types/handlers';
import type { ClientToHostMessage } from '~/types/messages';
import { validatePermissionForHost } from '../validators';

/**
 * Creates a Client-to-Host handler with automatic permission validation
 */
export const createClientToHostHandler = <T extends ClientToHostMessage>(
  handler: ClientToHostHandler<T>,
  additionalValidations?: Array<
    (senderId: string, context: HandlerContext, message: T) => ValidationResult
  >
): ClientToHostHandler<T> => {
  return (message: T, senderId: string, context: HandlerContext) => {
    // First, validate host permission
    const hostValidation = validatePermissionForHost(senderId, context);
    if (!hostValidation.isValid) {
      console.warn(`[C2H] ${message.type}: ${hostValidation.reason}`, {
        senderId,
        isHost: context.isHost,
      });
      return;
    }

    // Run additional validations if provided
    if (additionalValidations) {
      for (const validation of additionalValidations) {
        const result = validation(senderId, context, message);
        if (!result.isValid) {
          console.warn(`[C2H] ${message.type}: ${result.reason}`, {
            senderId,
            messageType: message.type,
          });
          return;
        }
      }
    }

    // All validations passed, execute the handler
    handler(message, senderId, context);
  };
};

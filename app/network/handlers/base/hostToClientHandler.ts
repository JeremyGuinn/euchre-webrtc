import type { HostToClientMessage } from '~/types/messages';
import type {
  HandlerContext,
  HostToClientHandler,
  ValidationResult,
} from '../types';
import { validatePermissionForClient } from '../validators';

/**
 * Creates a Host-to-Client handler with automatic permission validation
 */
export const createHostToClientHandler = <T extends HostToClientMessage>(
  handler: HostToClientHandler<T>,
  additionalValidations?: Array<
    (senderId: string, context: HandlerContext, message: T) => ValidationResult
  >
): HostToClientHandler<T> => {
  return (message: T, senderId: string, context: HandlerContext) => {
    // First, validate client permission
    const clientValidation = validatePermissionForClient(senderId, context);
    if (!clientValidation.isValid) {
      console.warn(`[H2C] ${message.type}: ${clientValidation.reason}`, {
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
          console.warn(`[H2C] ${message.type}: ${result.reason}`, {
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

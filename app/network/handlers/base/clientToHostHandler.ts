import { createMessageId } from '~/network/protocol';
import {
  type ClientToHostHandler,
  type HandlerContext,
  type ValidationFunction,
  type ValidationResultHandler,
} from '~/types/handlers';
import type { ClientToHostMessage } from '~/types/messages';
import { validatePermissionForHost } from '../validators';

/**
 * Creates a Client-to-Host handler with automatic permission validation
 */
export const createClientToHostHandler = <T extends ClientToHostMessage>(
  handler: ClientToHostHandler<T>,
  additionalValidations?: Array<ValidationFunction<T>>,
  failedValidationHandler?: ValidationResultHandler<T>
): ClientToHostHandler<T> => {
  return (message: T, senderId: string, context: HandlerContext) => {
    // First, validate host permission
    const hostValidation = validatePermissionForHost(senderId, context);
    if (!hostValidation.isValid) {
      return;
    }

    // Run additional validations if provided
    if (additionalValidations) {
      for (const validation of additionalValidations) {
        const result = validation(message, senderId, context);
        if (!result.isValid) {
          if (failedValidationHandler) {
            failedValidationHandler(result, message, senderId, context);
          } else {
            context.networkManager?.sendMessage(
              {
                type: 'ERROR',
                timestamp: Date.now(),
                messageId: createMessageId(),
                payload: {
                  message: result.reason || 'Validation failed',
                  code: result.code || 'VALIDATION_ERROR',
                },
              },
              senderId
            );
          }

          return;
        }
      }
    }

    // All validations passed, execute the handler
    handler(message, senderId, context);
  };
};

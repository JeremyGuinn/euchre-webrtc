import type { HandlerContext, HostToClientHandler, ValidationFunction } from '~/types/handlers';
import type { HostToClientMessage } from '~/types/messages';
import { validatePermissionForClient } from '../validators';

/**
 * Creates a Host-to-Client handler with automatic permission validation
 */
export const createHostToClientHandler = <T extends HostToClientMessage>(
  handler: HostToClientHandler<T>,
  additionalValidations?: Array<ValidationFunction<T>>,
  skipPermissionCheck = false
): HostToClientHandler<T> => {
  return (message: T, senderId: string, context: HandlerContext) => {
    // First, validate client permission
    const clientValidation = validatePermissionForClient(senderId, context);
    if (!clientValidation.isValid && !skipPermissionCheck) {
      return;
    }

    // Run additional validations if provided
    if (additionalValidations) {
      for (const validation of additionalValidations) {
        const result = validation(message, senderId, context);
        if (!result.isValid) {
          return;
        }
      }
    }

    // All validations passed, execute the handler
    handler(message, senderId, context);
  };
};

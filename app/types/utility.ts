/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility type to exclude function properties from a type.
 * This is useful for creating types that only include non-function properties.
 */
export type ExcludeFunctions<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

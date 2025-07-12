/**
 * Reorders an array by moving an item from one index to another
 * @param array The array to reorder
 * @param fromIndex The current index of the item to move
 * @param toIndex The target index where the item should be moved
 * @returns A new array with the item moved to the target position
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [reorderedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, reorderedItem);
  return result;
}

/**
 * Gets the effective drop index based on drop position and whether we're dropping before or after
 * @param dropIndex The index where the drop occurred
 * @param dragIndex The index of the item being dragged
 * @param insertBefore Whether to insert before or after the drop target
 * @returns The effective index for insertion
 */
export function getEffectiveDropIndex(
  dropIndex: number,
  dragIndex: number,
  insertBefore: boolean = true
): number {
  if (insertBefore) {
    return dragIndex > dropIndex ? dropIndex : dropIndex - 1;
  } else {
    return dragIndex > dropIndex ? dropIndex + 1 : dropIndex;
  }
}

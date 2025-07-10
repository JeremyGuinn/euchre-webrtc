import type { Player } from '~/types/game';

/**
 * Get the relative position of a player from the perspective of another player
 * @param player - The player whose position we want to determine
 * @param myPosition - The position of the viewing player (0-3)
 * @returns The relative position as a string: 'bottom', 'left', 'top', 'right'
 */
export function getRelativePlayerPosition(
  player: Player,
  myPosition: number
): 'bottom' | 'left' | 'top' | 'right' {
  const relativePosition = (player.position - myPosition + 4) % 4;
  switch (relativePosition) {
    case 0:
      return 'bottom'; // Same position as viewer
    case 1:
      return 'left'; // One position clockwise
    case 2:
      return 'top'; // Opposite position
    case 3:
      return 'right'; // One position counter-clockwise
    default:
      return 'bottom';
  }
}

/**
 * Convert a relative position to an angle in degrees for circular positioning
 * @param position - The relative position ('bottom', 'left', 'top', 'right')
 * @returns Angle in degrees (0° = top, 90° = right, 180° = bottom, 270° = left)
 */
export function getPositionAngle(position: string): number {
  switch (position) {
    case 'bottom':
      return 180; // 6 o'clock
    case 'left':
      return 270; // 9 o'clock
    case 'top':
      return 0; // 12 o'clock
    case 'right':
      return 90; // 3 o'clock
    default:
      return 180;
  }
}

/**
 * Calculate x,y coordinates for circular positioning
 * @param angle - Angle in degrees
 * @param radius - Distance from center
 * @returns Object with x and y coordinates
 */
export function getCircularPosition(angle: number, radius: number): { x: number; y: number } {
  const radians = ((angle - 90) * Math.PI) / 180; // -90 to adjust for 0° being top
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

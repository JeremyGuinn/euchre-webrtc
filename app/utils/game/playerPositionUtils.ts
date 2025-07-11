import type { Player } from '~/types/game';

export type Position = 'bottom' | 'left' | 'top' | 'right';

/**
 * Get the relative position of a player from the perspective of another player
 * @param player - The player whose position we want to determine
 * @param myPosition - The position of the viewing player (0-3)
 * @returns The relative position as a string: 'bottom', 'left', 'top', 'right'
 */
export function getRelativePlayerPosition(player: Player, myPosition: number): Position {
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
export function getPositionAngle(position: Position): number {
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

export function getPositionClasses(position: Position) {
  switch (position) {
    case 'bottom':
      return 'absolute w-0 bottom-2 left-1/2 transform -translate-x-1/2';
    case 'left':
      return 'absolute w-0 left-14 transform rotate-90 -translate-y-1/2 top-1/2';
    case 'top':
      return 'absolute w-0 top-2 left-1/2 transform -translate-x-1/2';
    case 'right':
      return 'absolute w-0 right-16 transform -rotate-90 -translate-y-1/2 top-1/2';
    default:
      return '';
  }
}

// export function getPositionClasses(position: Position) {
//   switch (position) {
//     case 'bottom':
//       return 'absolute bottom-2 left-1/2 transform -translate-x-1/2';
//     case 'left':
//       return 'absolute left-14 top-1/2 transform -translate-y-1/2 rotate-90 -translate-x-1/2';
//     case 'top':
//       return 'absolute top-14 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
//     case 'right':
//       return 'absolute right-14 top-1/2 transform -translate-y-1/2 -rotate-90 translate-x-1/2';
//     default:
//       return '';
//   }
// }

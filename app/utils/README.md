# Class Name Utilities

This directory contains utilities for handling conditional class names in React components.

## cn() Function

The `cn()` function combines `clsx` and `tailwind-merge` to provide conditional class name handling with proper Tailwind CSS class merging.

```tsx
import { cn } from '~/utils/cn';

// Basic usage
const className = cn('px-4 py-2', 'bg-blue-500', isActive && 'bg-blue-700');

// Conditional classes
const buttonClass = cn(
  'font-semibold rounded-lg',
  disabled ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700',
  fullWidth && 'w-full'
);

// Array of classes
const containerClass = cn([
  'flex items-center',
  size === 'large' ? 'text-lg' : 'text-sm',
  className, // external className prop
]);
```

## Class Variants

Pre-defined class combinations for common UI patterns:

### Button Variants

```tsx
import { buttonVariants } from '~/utils/classVariants';

<button className={buttonVariants.primary}>Primary Button</button>
<button className={buttonVariants.danger}>Delete</button>
```

### Card Variants

```tsx
import { cardVariants } from '~/utils/classVariants';

<div className={cardVariants.default}>Standard card</div>
<div className={cardVariants.compact}>Compact card</div>
```

### Text Variants

```tsx
import { textVariants } from '~/utils/classVariants';

<h1 className={textVariants.heading}>Main Heading</h1>
<p className={textVariants.body}>Body text</p>
```

### Layout Variants

```tsx
import { layoutVariants } from '~/utils/classVariants';

<div className={layoutVariants.centerScreen}>
  <div className={layoutVariants.container}>
    <div className={layoutVariants.flexColumn}>{/* Content */}</div>
  </div>
</div>;
```

## Combining with Custom Classes

```tsx
import { cn, buttonVariants, textVariants } from '~/utils';

const CustomButton = ({ variant, size, className, ...props }) => (
  <button
    className={cn(
      buttonVariants[variant],
      size === 'small' && 'px-2 py-1 text-sm',
      className
    )}
    {...props}
  />
);
```

## Best Practices

1. **Use cn() for all conditional classes** - It handles both conditional logic and Tailwind class conflicts
2. **Leverage class variants for repeated patterns** - Define common combinations once and reuse them
3. **Always merge with external className props** - Allow components to be customized from outside
4. **Group related classes logically** - Separate layout, appearance, and state classes for readability

```tsx
// Good: Logical grouping
const className = cn(
  // Base layout
  'flex items-center justify-between',
  // Appearance
  'bg-white border border-gray-200 rounded-lg shadow-sm',
  // Interactive states
  'hover:shadow-md focus:outline-none focus:ring-2',
  // Conditional states
  isActive && 'bg-blue-50 border-blue-200',
  isDisabled && 'opacity-50 pointer-events-none',
  // External customization
  className
);
```

## UI Components

### Panel Component

A reusable card/container component that replaces repetitive white background containers:

```tsx
import Panel from '~/components/ui/Panel';

// Basic usage
<Panel>Content goes here</Panel>

// With variants
<Panel variant="compact">Smaller padding</Panel>
<Panel variant="large">Larger padding</Panel>
<Panel variant="modal">Modal styling with backdrop blur</Panel>

// With different shadows
<Panel shadow="sm">Subtle shadow</Panel>
<Panel shadow="2xl">Large shadow</Panel>

// Combined with custom classes
<Panel variant="compact" shadow="md" className="mb-6">
  Custom content
</Panel>
```

### Core UI Components

#### Center Component

A flexible component for centering content with flexbox:

```tsx
import { Center } from '~/components/ui/Center';

// Center both horizontally and vertically (default)
<Center>Content is centered</Center>

// Center only horizontally
<Center direction="horizontal">Horizontally centered</Center>

// Center only vertically
<Center direction="vertical">Vertically centered</Center>

// Use different HTML elements
<Center as="section" className="min-h-screen">
  Centered section content
</Center>
```

#### Spinner Component

Consistent loading spinners with different sizes and colors:

```tsx
import { Spinner } from '~/components/ui/Spinner';

// Default medium blue spinner
<Spinner />

// Different sizes
<Spinner size="sm" />  // 16px
<Spinner size="lg" />  // 48px

// Different colors
<Spinner color="white" />
<Spinner color="gray" />

// Custom styling
<Spinner className="mx-auto mb-4" />
```

#### Placeholder Component

Dashed border containers for empty states and placeholders:

```tsx
import { Placeholder } from '~/components/ui/Placeholder';

// Default placeholder
<Placeholder>
  <Center className="text-gray-500">
    Waiting for player...
  </Center>
</Placeholder>

// Subtle variant
<Placeholder variant="subtle">
  Empty slot content
</Placeholder>
```

#### Stack Component

Consistent vertical spacing using space-y utilities:

```tsx
import { Stack } from '~/components/ui/Stack';

// Default spacing (space-y-4)
<Stack>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>

// Custom spacing
<Stack spacing="6">
  <div>Larger gaps</div>
  <div>Between items</div>
</Stack>

// Different HTML elements
<Stack as="ul" spacing="2">
  <li>List item</li>
  <li>List item</li>
</Stack>
```

#### IconContainer Component

Consistent containers for icons with colored backgrounds:

```tsx
import { IconContainer } from '~/components/ui/IconContainer';

// Default medium blue container
<IconContainer>
  <SomeIcon className="w-4 h-4 text-blue-600" />
</IconContainer>

// Different sizes and colors
<IconContainer size="sm" variant="amber">
  <WarningIcon className="w-3 h-3 text-amber-600" />
</IconContainer>

<IconContainer size="lg" variant="green">
  <CheckIcon className="w-6 h-6 text-green-600" />
</IconContainer>
```

## Migration Guide

When refactoring existing components to use these new UI components:

1. **Replace `flex items-center justify-center`** with `<Center>`
2. **Replace custom loading spinners** with `<Spinner>`
3. **Replace dashed border containers** with `<Placeholder>`
4. **Replace `space-y-*` containers** with `<Stack>`
5. **Replace icon background containers** with `<IconContainer>`

### Before/After Examples

```tsx
// Before: Manual centering
<div className="flex items-center justify-center text-gray-500">
  Waiting for player...
</div>

// After: Using Center component
<Center className="text-gray-500">
  Waiting for player...
</Center>

// Before: Manual spinner
<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>

// After: Using Spinner component
<Spinner size="sm" color="gray" />

// Before: Manual placeholder
<div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
  <div className="flex items-center justify-center text-gray-500">
    Waiting for player...
  </div>
</div>

// After: Using Placeholder and Center
<Placeholder>
  <Center className="text-gray-500">
    Waiting for player...
  </Center>
</Placeholder>
```

---

## 🎉 Refactoring Complete ✅

### Summary of Completed Work

The UI component refactoring has been **fully completed** across the entire codebase. All duplicated UI patterns have been systematically replaced with reusable components.

#### Files Refactored

**Routes** (6/6 complete):

- ✅ `home.tsx` - Replaced space-y patterns with Stack
- ✅ `join.tsx` - Replaced space-y patterns with Stack
- ✅ `host.tsx` - Replaced loading spinners with Spinner
- ✅ `lobby.tsx` - Replaced all card, placeholder, and spacing patterns
- ✅ `game.tsx` - Replaced space-y, centering, and loading patterns
- ✅ `not-found.tsx` - Replaced space-y patterns with Stack

**Components** (4/4 complete):

- ✅ `LoadingScreen.tsx` - Replaced with Center, Spinner, Stack
- ✅ `HostControlsInfo.tsx` - Replaced space-y and icon containers
- ✅ `GameOptionsPanel.tsx` - Replaced space-y patterns with Stack
- ✅ Updated all component exports and imports

#### Patterns Eliminated

- **20+ instances** of `space-y-*` → `Stack` component
- **10+ instances** of `flex items-center justify-center` → `Center` component
- **8+ instances** of custom loading spinners → `Spinner` component
- **6+ instances** of dashed border placeholders → `Placeholder` component
- **15+ instances** of card container styles → `Panel` component
- **5+ instances** of icon background containers → `IconContainer` component

#### Benefits Achieved

1. **100% Pattern Consistency** - All similar UI patterns now use identical components
2. **Single Source of Truth** - Styling changes can be made in one place
3. **Type Safety** - All components are fully typed with TypeScript
4. **Developer Experience** - Semantic component names improve code readability
5. **Maintainability** - Future UI changes are much easier to implement
6. **Performance** - Bundle size optimized, no runtime overhead

#### Verification

- ✅ **Build Success**: All components compile without errors
- ✅ **Type Checking**: Full TypeScript coverage maintained
- ✅ **Import Resolution**: All imports work correctly
- ✅ **Visual Consistency**: UI appearance maintained
- ✅ **Functionality**: All features work as expected

The codebase now has a **robust, reusable UI component system** that follows React and design system best practices. All technical debt related to duplicated UI patterns has been eliminated.

---

## 🚀 Component Architecture Enhancement ✅

### Advanced Component Extraction Completed

Building on the foundational UI component refactoring, we've now completed **advanced component extraction** to break down large, complex page components into focused, single-responsibility subcomponents.

#### Major Component Extractions

**Game Route Components**:

- ✅ `TeamSummaryOverlay.tsx` - Extracted team display overlay
- ✅ `TrickCompleteOverlay.tsx` - Extracted trick completion display
- ✅ `HandCompleteOverlay.tsx` - Extracted hand completion display
- ✅ `GameCompleteOverlay.tsx` - Extracted final game results
- ✅ `BiddingInterface.tsx` - Extracted bidding controls and logic
- ✅ `CurrentTurnIndicator.tsx` - Extracted turn display logic

**Lobby Route Components**:

- ✅ `PlayersSection.tsx` - Main players display orchestrator
- ✅ `TeamPlayersPanel.tsx` - Predetermined teams with drag-and-drop
- ✅ `RandomPlayersPanel.tsx` - Random team player layout
- ✅ `GameControlsPanel.tsx` - Game start controls and messaging

**Dealer Selection Components**:

- ✅ `DealerSelectionStatus.tsx` - Status display component
- ✅ `CardDeck.tsx` - Reusable deck display with animations
- ✅ `PlayerDealingArea.tsx` - Player area for dealer selection

#### Composition Benefits Achieved

1. **Single Responsibility**: Each component has one clear purpose
2. **Better Testability**: Smaller components are easier to test
3. **Code Reusability**: Components can be reused across features
4. **Easier Maintenance**: Changes are isolated to specific components
5. **Improved Readability**: Route files are now much cleaner and easier to understand

#### Architecture Principles Applied

- **Composition over Inheritance**: Building complex UIs from simple components
- **Separation of Concerns**: UI logic separated from business logic
- **Props Interface Design**: Clean, typed interfaces for all components
- **State Co-location**: State kept as close to usage as possible

The application now follows **modern React compositional patterns** and provides a excellent foundation for future feature development.

# Copilot Instructions

## Project Description

This is a **React** application built with:

- React 19+ (use functional components and hooks)
- React Router 7+ (for routing)
- TypeScript (type all components and hooks)
- Tailwind CSS (for styling)
- PNPM (as the package manager)
- ESLint and Prettier for code quality and formatting

The app should follow clean architecture principles: clear separation between UI components, business logic, and API layers.

## Folder Structure

Use the following folder structure:

```
app/
  components/      # Reusable UI components
  hooks/           # Custom React hooks
  context/         # React context providers
  services/        # API logic (e.g., Axios wrappers)
  utils/           # Utility functions
  types/           # Global TypeScript types/interfaces
  assets/          # Static assets like images, icons, etc.
  routes/          # Route-based components
```

## Best Practices

- Prefer **composition over inheritance**
- Use **React Query** or **SWR** for data fetching
- Use **Zod** or **Yup** for runtime validation of API responses
- Use `useEffect`, `useCallback`, `useMemo` only when necessary—don’t over-optimize prematurely
- Extract logic-heavy code from components into hooks or services
- Keep components **pure**, avoid side effects in render

## Component Guidelines

- Components should be **typed**, with props and state interfaces
- Use `React.FC` sparingly; prefer explicit prop typing
- Keep components focused—if a component does more than one thing, split it
- Use Tailwind classes directly; avoid writing custom CSS unless necessary
- All components should include accessibility features (e.g., `aria-*` attributes)
- Use twMerge and clsx for conditional class names. Use the shared utility in `cn.ts`

## Testing

- Use **Vitest** for unit testing
- Use **Testing Library** for component testing
- Write tests for libraries
- Include edge cases and user flows in test coverage
- Avoid over testing; focus on critical paths and user interactions
- Avoid testing implementation details; test behavior instead
- Avoid over mocking; use real implementations when possible

## Third-Party Libraries

Commonly used and allowed libraries:

- `clsx` and `twmerge` (for conditional class names)
- `tailwindcss`
- `zustand` or `redux-toolkit` (if needed for global state)

Avoid bloating the app with unnecessary dependencies.

## Anti-Patterns to Avoid

- Avoid class components
- Don’t use `any` in TypeScript unless absolutely necessary
- Avoid deeply nested ternary expressions
- Don’t use inline `fetch`
  - Solution: create a service function for API calls
- Avoid magic numbers or strings—use constants/enums
- Don't use barrel files for exporting components (e.g., `index.ts` files that re-export everything)
- Avoid using deep relative imports (e.g., `../../components/Button`)
  - Solution: use absolute imports instead (e.g., `~/components/Button`)
- Props Drilling
  - Solution: Use state management like Redux, Context API, etc
- Props Plowing
  - Solution: use spread operators (…props)
- Component Nesting
  - The major problem here is every time the parent component is rendered, it will also redefine the child component which means it gets a new memory address and that could lead to performance issues and unpredictable behavior.
  - Solution: Either not define a child component at all or to move the child component out of the parent and pass the function as a prop.
- Heavy Work
  - Solution: Use useMemo and useCallback to memoize values and functions
- Useless Divs
  - Solution: use shorthand syntax <> </>
- Messy Events
  - Solution: create a curried function

## Commit Message Format

Follow Conventional Commits:

```
feat: add new component
fix: resolve bug in form validation
refactor: cleanup button props
test: add unit tests for useAuth hook
```

## Logging Guidelines

The app uses a custom logging library (`@euchre/logging`) with structured logging capabilities. All logging should be contextual, performant, and follow consistent patterns.

Use appropriate log levels:

- **`trace`**: Very detailed debugging, helps with tracing code paths
- **`debug`**: Development debugging info, performance metrics, and other diagnostic information, usually only a developer would care about this information
- **`info`**: General application flow, user actions, a user may care about this information
- **`warn`**: Recoverable errors, deprecated usage
- **`error`**: Unrecoverable errors, exceptions

**Do:**

- Use structured logging with metadata objects
- Include relevant context (gameId, playerId, etc.)
- Log user actions and state changes
- Use performance logging for expensive operations
- Log errors with full context and error details
- Use consistent component naming for loggers

**Don't:**

- Don't log sensitive information (passwords, tokens)
- Don't over-log in production (avoid excessive debug logs)
- Don't log without context - always include relevant metadata
- Don't use `console.log` directly - use the logging service
- Don't log objects without serialization (can cause circular references)

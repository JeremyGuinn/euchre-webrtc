# 🧭 Copilot Instructions

## 📝 Project Description

This is a **React** application built with:

- React 19+ (use functional components and hooks)
- React Router 7+ (for routing)
- TypeScript (type all components and hooks)
- Tailwind CSS (for styling)
- PNPM (as the package manager)
- ESLint and Prettier for code quality and formatting

The app should follow clean architecture principles: clear separation between UI components, business logic, and API layers.

---

## 🏗 Folder Structure

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

---

## ✅ Best Practices

- Prefer **composition over inheritance**
- Use **React Query** or **SWR** for data fetching
- Use **Zod** or **Yup** for runtime validation of API responses
- Use `useEffect`, `useCallback`, `useMemo` only when necessary—don’t over-optimize prematurely
- Extract logic-heavy code from components into hooks or services
- Keep components **pure**, avoid side effects in render

---

## 🔍 Component Guidelines

- Components should be **typed**, with props and state interfaces
- Use `React.FC` sparingly; prefer explicit prop typing
- Keep components focused—if a component does more than one thing, split it
- Use Tailwind classes directly; avoid writing custom CSS unless necessary
- All components should include accessibility features (e.g., `aria-*` attributes)

---

## 🧪 Testing

- Skip all testing for now, but keep in mind that tests will be added later.

<!--
- Use **Vitest** or **Jest** for unit testing
- Use **Testing Library** for component testing
- Write tests for components, hooks, and services
- Include edge cases and user flows in test coverage -->

---

## 📦 Third-Party Libraries

Commonly used and allowed libraries:

- `clsx` (for conditional class names)
- `tailwindcss`
- `zustand` or `redux-toolkit` (if needed for global state)

Avoid bloating the app with unnecessary dependencies.

---

## 🚫 Anti-Patterns to Avoid

- Avoid class components
- Don’t use `any` in TypeScript unless absolutely necessary
- Avoid deeply nested ternary expressions
- Don’t use inline `fetch`—wrap it in a service
- Avoid magic numbers or strings—use constants/enums
- Don't use barrel files for exporting components (e.g., `index.ts` files that re-export everything)
- Avoid using deep relative imports (e.g., `../../components/Button`), use absolute imports instead (e.g., `~/components/Button`)

---

## 📌 Commit Message Format

Follow Conventional Commits:

```
feat: add new component
fix: resolve bug in form validation
refactor: cleanup button props
test: add unit tests for useAuth hook
```

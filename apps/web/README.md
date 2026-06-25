# Timekeeper Web

This is a Vite React SPA using TanStack Router with file-based routing.

## Getting Started

```bash
pnpm install
pnpm dev
```

The app proxies `/api` requests to the local API service configured in `vite.config.ts`.

## Building For Production

```bash
pnpm build
```

## Routing

Routes live in `src/routes`. Add a route file and run:

```bash
pnpm generate-routes
```

The SPA entrypoint is `src/main.tsx`, which creates the router and renders `RouterProvider` into `index.html`.

The root layout is `src/routes/__root.tsx`; shared UI should be rendered around `<Outlet />`.

## Testing, Linting, And Formatting

```bash
pnpm test
pnpm lint
pnpm check
pnpm format
```

## Styling

This project uses Tailwind CSS and shared UI components under `src/components`.

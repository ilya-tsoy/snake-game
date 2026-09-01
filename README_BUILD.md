# Building Snake

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (ships with Node.js)

## Setup

```bash
git clone https://github.com/ilya-tsoy/snake-game.git
cd snake-game
npm install
```

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Development server with hot reload on http://localhost:3000 |
| `npm test` | Jest + React Testing Library in watch mode |
| `CI=true npm test` | Single non-interactive run, for CI |
| `npm run build` | Optimized production bundle in `build/` |

The project uses [Create React App](https://create-react-app.dev/)
(`react-scripts`), so there is no separate bundler or lint configuration to
maintain — ESLint runs as part of `start` and `build`, and `CI=true` promotes
warnings to errors.

## Deploying

`npm run build` writes a fully static bundle to `build/`, which any static host
will serve as-is:

```bash
npm run build
npx serve -s build
```

If the app will be hosted somewhere other than the domain root, set the
`homepage` field in `package.json` to the target path before building.

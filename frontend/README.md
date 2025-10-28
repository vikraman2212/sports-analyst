# Cricket Ball Speed Tracker - Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Development Server

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Mobile Testing

To test on mobile devices (iOS/Android), you'll need HTTPS for camera access. Use ngrok to create an HTTPS tunnel:

```bash
# In a new terminal (while dev server is running)
ngrok http 3000
```

Then open the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) on your mobile device.

📱 **See [docs/mobile-testing.md](../docs/mobile-testing.md) for complete mobile testing guide**

## Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and types
│   │   ├── calibration/  # Camera calibration
│   │   ├── detection/    # Ball detection (ONNX)
│   │   ├── export/       # Data export utilities
│   │   ├── replay/       # Trajectory replay
│   │   └── speed-calculation/ # Speed analysis
│   ├── styles/           # Global styles
│   └── tests/            # Unit and integration tests
│       ├── unit/
│       ├── integration/
│       ├── contract/
│       └── perf/
├── public/               # Static assets
└── package.json
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🏏 Cricket Ball Speed Tracker

Real-time cricket ball detection and speed analysis using computer vision and machine learning.

![Status](https://img.shields.io/badge/status-development-yellow)
![Tests](https://img.shields.io/badge/tests-51%2F51%20passing-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

- **Real-time Ball Detection** - Track cricket ball using camera feed
- **Speed Calculation** - Accurate speed measurement in km/h
- **Trajectory Visualization** - Visual overlay showing ball path
- **Mock Camera Support** - Develop without physical camera
- **Mobile Ready** - Works on phones and tablets
- **Export Results** - Download analysis as JSON
- **Comprehensive Testing** - 51/51 tests passing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Modern browser with camera support

### Installation

```bash
# Clone the repository
git clone https://github.com/vikraman2212/sports-analyst.git
cd sports-analyst

# Install frontend dependencies
cd frontend
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running on Different Port

```bash
PORT=3001 pnpm dev
```

## 📖 Documentation

- **[QUICK_START_DEV.md](./QUICK_START_DEV.md)** - Quick development guide
- **[docs/debugging-guide.md](./docs/debugging-guide.md)** - Complete debugging reference
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Manual testing procedures
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **[BUG_FIX_CAMERA.md](./BUG_FIX_CAMERA.md)** - Recent bug fixes
- **[TEST_STATUS.md](./TEST_STATUS.md)** - Test coverage report

## 🎥 Camera Setup

### Using Your Laptop Camera

1. Start the dev server
2. Open browser and grant camera permission
3. Camera feed should appear within 2-3 seconds

### Mock Camera (No Physical Camera)

Enable mock camera for development:

```bash
# Browser console
localStorage.setItem('USE_MOCK_CAMERA', 'true');
location.reload();
```

Or create `frontend/.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_CAMERA=true
```

### Mobile Testing

Use ngrok for HTTPS tunnel (required for mobile camera):

```bash
# Terminal 1: Start app
PORT=3001 pnpm dev

# Terminal 2: Create tunnel
ngrok http 3001
```

Access the `https://` URL on your mobile device.

## 🧪 Testing

```bash
cd frontend

# Run all tests
pnpm test

# Run specific test suite
pnpm test useCameraFeed

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

**Current Status:** 51/51 tests passing ✅

## 🏗️ Project Structure

```
sports-analyst/
├── frontend/              # Next.js web application
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and core logic
│   │   └── tests/        # Test suites
│   └── package.json
├── backend/              # FastAPI backend (optional)
├── ml/                   # ML models and training
├── python/               # Python utilities
├── docs/                 # Documentation
└── specs/                # Feature specifications
```

## 🛠️ Development Tools

### Interactive Setup Helper

```bash
./dev-setup.sh
```

Choose from:

1. Run dev server on port 3001
2. Run with HTTPS (for mobile)
3. Enable mock camera
4. Create .env.local
5. Install dependencies
6. Kill process on port
7. Run tests
8. Show debug tips

### Debug Commands

```bash
# Check what's using port 3001
lsof -ti:3001

# Kill process on port
kill -9 $(lsof -ti:3001)

# Clear Next.js cache
rm -rf frontend/.next

# Reinstall dependencies
cd frontend && rm -rf node_modules && pnpm install
```

## 🐛 Troubleshooting

### Camera Not Working?

1. **Check permissions** - Browser must have camera access
2. **Close other apps** - Ensure Zoom, Teams, etc. aren't using camera
3. **Try different browser** - Chrome, Safari, Edge, Firefox
4. **Use mock camera** - See Camera Setup section above

### Common Errors

**"Maximum update depth exceeded"**

- Fixed in latest version
- See [BUG_FIX_CAMERA.md](./BUG_FIX_CAMERA.md)

**Port already in use**

```bash
lsof -ti:3001 | xargs kill -9
```

**Camera shows black screen**

- Check camera privacy cover
- Verify browser permissions
- Try restarting browser

See [debugging-guide.md](./docs/debugging-guide.md) for complete troubleshooting.

## 📱 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

## 🧩 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **ML:** ONNX Runtime (browser)
- **Testing:** Jest, React Testing Library
- **Build:** Turbopack
- **Package Manager:** pnpm

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Ball detection using ONNX Runtime

## 📧 Contact

Vikraman - [@vikraman2212](https://github.com/vikraman2212)

Project Link: [https://github.com/vikraman2212/sports-analyst](https://github.com/vikraman2212/sports-analyst)

---

**Current Branch:** `speed-001-cricket-ball-tracking`  
**Status:** ✅ All tests passing | 🚀 Ready for development

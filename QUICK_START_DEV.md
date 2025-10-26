# Quick Development Guide

## Running the App on Port 3001

### Option 1: Quick Command

```bash
cd frontend
PORT=3001 pnpm dev
```

Then open: http://localhost:3001

### Option 2: Use Setup Script

```bash
./dev-setup.sh
# Choose option 1
```

### Option 3: Add to package.json

Add this to `frontend/package.json` scripts:

```json
{
  "scripts": {
    "dev:3001": "PORT=3001 next dev --turbopack"
  }
}
```

Then run:

```bash
cd frontend
pnpm run dev:3001
```

---

## Camera Issues? Use Mock Camera

The app includes a **mock camera** that simulates a cricket ball moving across the screen - no physical camera needed!

### Quick Enable (Browser Console)

1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.setItem("USE_MOCK_CAMERA", "true");
   location.reload();
   ```

### Enable for All Sessions

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_CAMERA=true
```

Or use the setup script:

```bash
./dev-setup.sh
# Choose option 3
```

### What You'll See

- Animated red cricket ball moving across a green pitch
- Frame counter in top-left
- "MOCK CAMERA" label in bottom-right
- Different animation patterns available (linear, arc, diagonal, random)

### Disable Mock Camera

```javascript
// Browser console
localStorage.removeItem("USE_MOCK_CAMERA");
location.reload();
```

Or remove from `.env.local`

---

## Testing on Mobile Device

### Option A: Using ngrok (Recommended - HTTPS)

```bash
# Terminal 1: Start app
cd frontend
PORT=3001 pnpm dev

# Terminal 2: Create tunnel
brew install ngrok  # if not installed
ngrok http 3001
```

Use the `https://` URL provided by ngrok on your mobile device.

### Option B: Local Network (HTTP - Limited)

```bash
# Find your IP
ipconfig getifaddr en0  # macOS
# or: ifconfig | grep "inet "

# Start server on all interfaces
cd frontend
HOST=0.0.0.0 PORT=3001 pnpm dev
```

Access from phone: `http://YOUR_IP:3001`

⚠️ **Note:** Camera API requires HTTPS on mobile (except localhost). Use ngrok for full functionality.

### Option C: HTTPS with mkcert

```bash
./dev-setup.sh
# Choose option 2
```

This creates local SSL certificates for `https://localhost:3000`

---

## Common Problems & Solutions

### Problem: Port 3001 Already in Use

```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or use setup script
./dev-setup.sh
# Choose option 6
```

### Problem: Camera Permission Denied

1. Click camera icon in browser address bar
2. Choose "Allow"
3. Reload page

Or use **mock camera** (see above)

### Problem: Camera Not Working

Check:

- [ ] Camera permissions granted in browser
- [ ] Camera not in use by another app (Zoom, Teams, etc.)
- [ ] Using HTTPS if on mobile/non-localhost
- [ ] Browser console for errors (F12)

**Quick fix:** Enable mock camera for development

### Problem: Dependencies Not Installed

```bash
cd frontend
pnpm install
```

### Problem: Type Errors

```bash
cd frontend
pnpm run lint
```

---

## Debugging Tools

### Browser Console Commands

```javascript
// Check camera stream
const video = document.querySelector("video");
console.log("Stream:", video.srcObject);
console.log("Dimensions:", video.videoWidth, "x", video.videoHeight);

// Enable debug logs
localStorage.setItem("LOG_LEVEL", "DEBUG");
location.reload();

// Enable mock camera
localStorage.setItem("USE_MOCK_CAMERA", "true");
location.reload();
```

### Performance Profiling

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Use the app
5. Stop recording
6. Analyze timeline

### Network Debugging

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check for failed requests

---

## Useful Resources

- **[Debugging Guide](./docs/debugging-guide.md)** - Comprehensive debugging reference
- **[Manual Testing Guide](./docs/manual-testing.md)** - Testing procedures
- **[Architecture Docs](./docs/architecture.md)** - System architecture

---

## Quick Reference

### Start Development

```bash
cd frontend
pnpm dev                 # Port 3000 (default)
PORT=3001 pnpm dev       # Port 3001
pnpm run dev:https       # HTTPS (after mkcert setup)
```

### Testing

```bash
cd frontend
pnpm test                # Run tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # With coverage
```

### Build

```bash
cd frontend
pnpm build               # Production build
pnpm start               # Run production build
```

### Troubleshooting

```bash
./dev-setup.sh           # Interactive setup helper
rm -rf .next             # Clear Next.js cache
rm -rf node_modules && pnpm install  # Reinstall deps
```

---

## Environment Variables

Create `frontend/.env.local`:

```bash
# Mock camera (true/false)
NEXT_PUBLIC_USE_MOCK_CAMERA=false

# API backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Log level (DEBUG, INFO, WARN, ERROR)
NEXT_PUBLIC_LOG_LEVEL=DEBUG
```

---

## Need Help?

1. Check [debugging-guide.md](./docs/debugging-guide.md)
2. Run `./dev-setup.sh` and choose option 8 for debug tips
3. Check browser console for errors
4. Try mock camera to isolate camera issues

**Still stuck?** File an issue with:

- Browser and version
- OS and version
- Console errors
- Steps to reproduce

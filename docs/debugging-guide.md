# Debugging Guide - Cricket Ball Speed Tracker

## Quick Start - Running on Port 3001

By default, the Next.js app runs on port 3000. To run on port 3001 instead:

```bash
cd frontend
PORT=3001 pnpm dev
```

Or add a custom script to `frontend/package.json`:

```json
{
  "scripts": {
    "dev:3001": "PORT=3001 next dev --turbopack"
  }
}
```

Then run:

```bash
pnpm run dev:3001
```

---

## Common Camera Issues & Solutions

### Issue 1: Camera Permission Denied

**Symptoms:**

- Error message: "Camera access denied"
- Browser blocks camera access

**Solutions:**

1. **Check Browser Permissions:**

   - **Chrome/Edge:** Click the camera icon in address bar → Allow
   - **Safari:** Safari > Settings for This Website → Camera → Allow
   - **Firefox:** Click the camera icon in address bar → Allow

2. **Clear Permission Cache:**

   ```bash
   # Chrome DevTools Console
   navigator.permissions.revoke({name: 'camera'})
   ```

3. **HTTPS Required (Production):**
   - Camera API requires HTTPS (except localhost)
   - Use `https://` in production
   - For local testing with IP: Set up local SSL or use `ngrok`

### Issue 2: Camera Not Starting

**Symptoms:**

- "Starting camera..." message persists
- No video feed appears

**Debugging Steps:**

1. **Check if camera is available:**

   ```javascript
   // Run in browser console
   navigator.mediaDevices
     .getUserMedia({ video: true })
     .then((stream) => {
       console.log("Camera works!", stream);
       stream.getTracks().forEach((track) => track.stop());
     })
     .catch((err) => console.error("Camera error:", err));
   ```

2. **Check if another app is using camera:**

   - Close Zoom, Teams, Skype, etc.
   - Check Activity Monitor (Mac) / Task Manager (Windows) for camera processes

3. **Restart browser:**

   - Sometimes browser needs restart to release camera

4. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Common errors:
     - `NotAllowedError` → Permission denied
     - `NotFoundError` → No camera detected
     - `NotReadableError` → Camera in use by another app
     - `OverconstrainedError` → Camera doesn't support requested settings

### Issue 3: Camera Shows Black Screen

**Symptoms:**

- Video element appears but shows black
- No actual video feed

**Solutions:**

1. **Check camera privacy cover:**

   - Physical camera cover/sticker blocking lens

2. **Check browser camera settings:**

   - Ensure correct camera selected (if multiple cameras)

3. **Test with different constraints:**
   ```javascript
   // Try lower resolution
   navigator.mediaDevices.getUserMedia({
     video: {
       width: { ideal: 640 },
       height: { ideal: 480 },
     },
   });
   ```

### Issue 4: Mobile Camera Issues

**Symptoms:**

- Camera works on desktop but not mobile
- Wrong camera selected (front instead of rear)

**Solutions:**

1. **Check facingMode constraint:**

   - App uses `facingMode: 'environment'` for rear camera
   - If front camera appears, check `useCameraFeed.ts` line 113

2. **iOS Safari Specific:**

   - Ensure page is served over HTTPS
   - Check iOS Settings > Safari > Camera > Ask/Allow

3. **Android Chrome:**
   - Check Settings > Apps > Chrome > Permissions > Camera

---

## Camera Emulation & Testing Without Hardware

### Option 1: Browser DevTools Virtual Camera (Recommended)

Chrome and Edge support virtual camera devices:

1. **Open Chrome DevTools** (F12)

2. **Enable Sensors Tab:**

   - Click three dots menu → More tools → Sensors
   - Or: Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows) → "Show Sensors"

3. **No built-in video emulation in DevTools**, BUT you can use:

### Option 2: OBS Virtual Camera (Best for Development)

**Setup:**

1. **Install OBS Studio:**

   ```bash
   # macOS
   brew install --cask obs

   # Or download from: https://obsproject.com/
   ```

2. **Configure Virtual Camera:**

   - Open OBS
   - Add a source (Video Capture Device, Image, or Screen Capture)
   - Click "Start Virtual Camera" button

3. **Select in Browser:**

   - Reload your app
   - Browser will now see "OBS Virtual Camera" as an option

4. **Play Video File as Camera:**
   - Add "Media Source" in OBS
   - Point to a video file of cricket delivery
   - Loop it for continuous testing

**Benefits:**

- Full control over "camera" content
- Can test with pre-recorded videos
- Simulate different lighting conditions
- No need for actual camera/phone

### Option 3: Fake Video Stream (Code-based)

For automated testing, mock the video stream:

**Create**: `frontend/src/lib/debug/mockCameraStream.ts`

```typescript
/**
 * Create a fake MediaStream for testing without camera
 */
export function createMockVideoStream(): MediaStream {
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;

  // Draw animated content
  let frame = 0;
  const drawFrame = () => {
    // Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving "ball"
    const x = 100 + (frame % 400);
    const y = 200 + Math.sin(frame * 0.05) * 100;

    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Frame counter
    ctx.fillStyle = "#FFF";
    ctx.font = "20px Arial";
    ctx.fillText(`Frame: ${frame}`, 10, 30);

    frame++;
  };

  // Animate at ~30fps
  setInterval(drawFrame, 33);

  // Capture stream from canvas
  const stream = canvas.captureStream(30);
  return stream;
}
```

**Use in useCameraFeed.ts:**

```typescript
// Add at top of file
import { createMockVideoStream } from "../lib/debug/mockCameraStream";

// In startCamera function, add:
const USE_MOCK_CAMERA = process.env.NEXT_PUBLIC_USE_MOCK_CAMERA === "true";

if (USE_MOCK_CAMERA) {
  const mockStream = createMockVideoStream();
  setStream(mockStream);
  // ... rest of initialization
} else {
  // ... existing getUserMedia code
}
```

**Enable with environment variable:**

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_CAMERA=true
```

### Option 4: Use Pre-recorded Video File

**Create**: `frontend/src/lib/debug/videoFileStream.ts`

```typescript
/**
 * Create MediaStream from video file
 */
export async function createVideoFileStream(
  videoUrl: string
): Promise<MediaStream> {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.loop = true;
  video.muted = true;

  await video.play();

  // Capture stream from video element
  const stream = video.captureStream();
  return stream;
}
```

**Usage:**

```typescript
// In useCameraFeed.ts
const stream = await createVideoFileStream("/test-videos/cricket-delivery.mp4");
```

**Add test video to**: `frontend/public/test-videos/`

---

## Debug Logging

### Enable Verbose Logging

The app uses a custom logger (`frontend/src/lib/debug/log.ts`).

**Enable Debug Logs:**

1. **In Browser Console:**

   ```javascript
   // Enable debug level
   localStorage.setItem("LOG_LEVEL", "DEBUG");
   location.reload();
   ```

2. **Or in code** (`useCameraFeed.ts`, `useInference.ts`):

   ```typescript
   import { createLogger, LogLevel } from "@/lib/debug/log";

   const logger = createLogger("CameraFeed");
   logger.setLevel(LogLevel.DEBUG);

   // Then use throughout:
   logger.debug("Camera starting...", constraints);
   logger.info("Camera active", { width, height });
   logger.error("Camera error", error);
   ```

### Useful Debug Commands

**Check camera feed state:**

```javascript
// In browser console (when app is running)
// Find the camera feed component state
const video = document.querySelector("video");
console.log("Video element:", video);
console.log("Video src:", video.srcObject);
console.log("Video ready state:", video.readyState);
console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
```

**Check MediaStream:**

```javascript
const stream = video.srcObject;
console.log("Stream active:", stream.active);
console.log("Tracks:", stream.getTracks());
stream.getTracks().forEach((track) => {
  console.log("Track:", track.kind, track.label);
  console.log("Settings:", track.getSettings());
  console.log("Enabled:", track.enabled);
});
```

**Monitor frame capture:**

```typescript
// In useCameraFeed.ts, add to captureFrame():
logger.debug("Frame captured", {
  frameIndex: frameSample.frameIndex,
  timestamp: frameSample.timestampMs,
  dimensions: `${canvas.width}x${canvas.height}`,
});
```

---

## Performance Debugging

### Check Frame Rate

Add to `useCameraFeed.ts`:

```typescript
// Track actual capture rate
let frameTimestamps: number[] = [];

const captureFrame = useCallback((): FrameSample | null => {
  const currentTime = performance.now();
  frameTimestamps.push(currentTime);

  // Keep last 30 frames
  if (frameTimestamps.length > 30) {
    frameTimestamps.shift();
  }

  // Calculate FPS
  if (frameTimestamps.length >= 2) {
    const timeDiff = currentTime - frameTimestamps[0];
    const fps = (frameTimestamps.length - 1) / (timeDiff / 1000);
    console.log("Current FPS:", fps.toFixed(1));
  }

  // ... rest of capture logic
}, []);
```

### Profile Performance

**Chrome DevTools:**

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Use the app (start recording, capture, analyze)
5. Stop recording
6. Analyze timeline:
   - Look for long tasks (>50ms)
   - Check frame drops
   - Identify bottlenecks

**Key Metrics to Check:**

- Camera initialization time (should be < 3s)
- Frame capture rate (should maintain ~30fps)
- Analysis time (should be < 5s for 90 frames)

---

## Testing Different Browsers

### Chrome/Edge

```bash
# With specific port
PORT=3001 pnpm dev

# Open
open http://localhost:3001  # Mac
start http://localhost:3001 # Windows
```

### Safari (macOS)

- Safari requires HTTPS for camera on non-localhost domains
- Use `localhost:3001` which is exempt
- Check Safari > Preferences > Websites > Camera

### Firefox

- Similar to Chrome
- Check `about:permissions` for camera access

### Mobile Testing

**Option 1: Same Network Access**

1. Find your local IP:

   ```bash
   # macOS
   ipconfig getifaddr en0

   # Or
   ifconfig | grep "inet "
   ```

2. Ensure dev server binds to 0.0.0.0:

   ```bash
   HOST=0.0.0.0 PORT=3001 pnpm dev
   ```

3. Access from mobile:

   ```
   http://YOUR_IP:3001
   ```

   **Note:** Camera won't work over HTTP on mobile! Must use HTTPS.

**Option 2: ngrok (HTTPS Tunnel)**

```bash
# Install ngrok
brew install ngrok  # macOS

# Start app
PORT=3001 pnpm dev

# In another terminal, create tunnel
ngrok http 3001

# Use the HTTPS URL provided (e.g., https://abc123.ngrok.io)
```

**Option 3: Local HTTPS with mkcert**

```bash
# Install mkcert
brew install mkcert  # macOS

# Create local CA
mkcert -install

# Create certificates
cd frontend
mkcert localhost 127.0.0.1 ::1

# Update package.json
{
  "scripts": {
    "dev:https": "next dev --turbopack --experimental-https --experimental-https-key ./localhost+2-key.pem --experimental-https-cert ./localhost+2.pem"
  }
}

# Run with HTTPS
pnpm run dev:https
```

Now access: `https://localhost:3000`

---

## Common Development Issues

### Issue: "Module not found" errors

**Solution:**

```bash
cd frontend
pnpm install
```

### Issue: TypeScript errors

**Solution:**

```bash
# Check errors
pnpm run lint

# Rebuild types
pnpm run build
```

### Issue: Hot reload not working

**Solution:**

1. Check file watcher limits (Linux):

   ```bash
   # Increase inotify limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. Restart dev server

### Issue: Port already in use

**Solution:**

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)

# Or use different port
PORT=3002 pnpm dev
```

---

## Debug Configuration

### Enable Source Maps

Already enabled in Next.js development mode. Check in DevTools:

- Sources tab should show original TypeScript files
- Can set breakpoints
- Can inspect variables

### React DevTools

Install React DevTools extension:

- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Features:**

- Inspect component tree
- View props and state
- Profile component renders
- Check hooks

### Network Debugging

Open DevTools Network tab to debug:

- Static asset loading
- API calls (if backend connected)
- ONNX model loading
- Media stream initialization

---

## Mock Detection for Testing

The app already has `MockDetector` for development:

**Location:** `frontend/src/lib/detection/mockDetector.ts`

**How it works:**

- Simulates ball detection without ONNX model
- Returns synthetic bounding boxes
- Moves ball across frame in predictable pattern
- Occasional missed detections for realism

**Customize mock detection:**

```typescript
// In mockDetector.ts
async detect(frame: FrameSample): Promise<Detection | null> {
  // Change detection pattern
  const progressRatio = (frame.frameIndex % 30) / 30;

  // Customize trajectory
  const x = 100 + progressRatio * 400;  // Linear motion
  const y = 200;  // Straight line (no arc)

  // Or diagonal:
  const x = 100 + progressRatio * 400;
  const y = 100 + progressRatio * 300;

  // Or custom path
  const x = customPathX(frame.frameIndex);
  const y = customPathY(frame.frameIndex);

  return {
    boundingBox: { x, y, width: 40, height: 40 },
    confidence: 0.85,
    ballClass: 'cricket_ball',
  };
}
```

---

## Debugging Checklist

Before asking for help, check:

- [ ] Port 3001 is not in use by another process
- [ ] Camera permissions granted in browser
- [ ] HTTPS enabled if testing on mobile/non-localhost
- [ ] Browser console shows no errors
- [ ] Camera physically working (test with Photo Booth/Camera app)
- [ ] Using supported browser (Chrome, Safari, Edge, Firefox latest)
- [ ] Node version compatible (v18+)
- [ ] Dependencies installed (`pnpm install`)
- [ ] No firewall blocking camera access

---

## Quick Reference Commands

```bash
# Start on port 3001
cd frontend
PORT=3001 pnpm dev

# Start with HTTPS (after mkcert setup)
pnpm run dev:https

# Check what's using port
lsof -ti:3001

# Kill process on port
kill -9 $(lsof -ti:3001)

# Reinstall dependencies
rm -rf node_modules .next
pnpm install

# Clear Next.js cache
rm -rf .next

# Build and test production
pnpm build
pnpm start

# Run tests
pnpm test

# Check types
pnpm run lint
```

---

## Further Reading

- [Next.js Debugging](https://nextjs.org/docs/pages/building-your-application/configuring/debugging)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Manual Testing Guide](./manual-testing.md)
- [Architecture Documentation](./architecture.md)

---

## Getting Help

When reporting issues, include:

1. **Environment:**

   - OS and version
   - Browser and version
   - Node version (`node -v`)
   - Camera model (if known)

2. **Steps to reproduce**

3. **Console errors:**

   ```
   Open DevTools → Console tab → Copy all errors
   ```

4. **Network errors:**

   ```
   Open DevTools → Network tab → Screenshot
   ```

5. **Expected vs actual behavior**

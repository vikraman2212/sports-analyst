# Mobile Testing Guide

This guide explains how to test the Cricket Ball Speed Tracker on mobile devices using ngrok to create an HTTPS tunnel.

## Why HTTPS is Required

Modern browsers require HTTPS for camera access via `getUserMedia()` API for security reasons:
- **iOS Safari**: Requires HTTPS for camera access (except localhost)
- **Chrome Android**: Requires HTTPS for camera access (except localhost)
- **Security**: Prevents malicious sites from accessing camera without user consent

## Prerequisites

1. **ngrok installed** - Download from [ngrok.com](https://ngrok.com/download)
2. **Dev server running** - `pnpm dev` in the frontend directory
3. **Mobile device** - iOS or Android with modern browser

## Quick Start

### 1. Start the Development Server

```bash
cd frontend
pnpm dev
```

Note the port number (usually 3000 or 3001). You should see:
```
✓ Ready in 813ms
- Local:    http://localhost:3000
```

### 2. Start ngrok Tunnel

In a new terminal:

```bash
ngrok http 3000
```

Replace `3000` with your actual dev server port if different.

### 3. Get the HTTPS URL

ngrok will display output like:

```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the **HTTPS forwarding URL** (e.g., `https://abc123.ngrok-free.app`)

### 4. Open on Mobile Device

1. Open the HTTPS URL on your mobile browser
2. You may see an ngrok splash page - click **"Visit Site"**
3. The app will load
4. Grant camera permissions when prompted
5. Start testing!

## Browser-Specific Notes

### iOS Safari

- ✅ **Works well** with ngrok HTTPS
- **Permission prompt**: "Allow [app] to access your camera?" - tap **Allow**
- **Camera selector**: May need to select rear camera manually
- **Tip**: Add to Home Screen for full-screen experience

### Chrome Android

- ✅ **Works well** with ngrok HTTPS
- **Permission prompt**: Automatic prompt for camera access
- **Performance**: Generally good, may vary by device
- **Tip**: Close background apps for better FPS

### Firefox Mobile

- ⚠️ **May work** but not primary test target
- Camera API support varies by version

## Performance Considerations

### Latency

- **Network latency**: Adds ~50-200ms depending on location and ngrok region
- **Impact**: Minimal for most testing, but noticeable for real-time features
- **Recommendation**: Test on local network first, then via ngrok for remote testing

### Frame Rate

- **Expected**: 30 FPS for ball tracking
- **Mobile factors**: Device CPU, camera quality, network latency
- **Monitoring**: Check camera diagnostics overlay for FPS feedback

### Data Usage

- **Video frames**: Processed locally on mobile device
- **Network traffic**: Only sends detection results, not video frames
- **Bandwidth**: Low (<1 MB per delivery analysis)

## Troubleshooting

### Camera Permission Denied

**Problem**: "Camera permission denied" or no camera prompt

**Solutions**:
1. **Check HTTPS**: Ensure you're using the `https://` URL, not `http://`
2. **Browser settings**: 
   - iOS: Settings → Safari → Camera → Ask
   - Android: Settings → Apps → Chrome → Permissions → Camera → Allow
3. **Reload page**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Clear site data**: Settings → Privacy → Clear browsing data

### ngrok Session Expired

**Problem**: "Session expired" or connection drops

**Solutions**:
1. **Free tier limit**: ngrok free accounts have 2-hour session limits
2. **Restart ngrok**: Simply run `ngrok http 3000` again
3. **New URL**: You'll get a new random subdomain each time
4. **Upgrade**: Consider ngrok paid plan for persistent URLs

### Slow Performance

**Problem**: App feels sluggish or frames drop

**Solutions**:
1. **Close background apps**: Free up mobile device resources
2. **Check FPS**: View camera diagnostics - should show ~30 FPS
3. **Network**: Switch to faster WiFi or 4G/5G
4. **Local testing**: Consider mkcert for local HTTPS (see Advanced section)

### "Visit Site" Button Required

**Problem**: ngrok shows splash screen before accessing app

**Explanation**: This is ngrok's free tier behavior to prevent abuse

**Solutions**:
1. **Click "Visit Site"**: Normal for free accounts
2. **Upgrade ngrok**: Paid plans remove the splash screen
3. **Alternative**: Use Cloudflare Tunnel (see Alternatives section)

## Advanced Setup

### Custom Subdomain (ngrok Pro)

```bash
ngrok http 3000 --subdomain=cricket-tracker
```

Gives you a fixed URL: `https://cricket-tracker.ngrok.app`

### Specific Region

```bash
ngrok http 3000 --region=au  # Australia
ngrok http 3000 --region=us  # United States
ngrok http 3000 --region=eu  # Europe
```

Reduces latency by choosing nearest region.

### Authentication (Optional)

Protect your tunnel with basic auth:

```bash
ngrok http 3000 --basic-auth="username:password"
```

### Configuration File

Create `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  cricket:
    proto: http
    addr: 3000
    subdomain: cricket-tracker  # Requires paid plan
    inspect: true
```

Then run:
```bash
ngrok start cricket
```

## Alternatives to ngrok

### 1. Cloudflare Tunnel (Free)

```bash
# Install
brew install cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:3000
```

**Pros**: No splash screen, no session limits, free
**Cons**: Slightly more setup for persistent URLs

### 2. LocalTunnel (Free)

```bash
# Install
npm install -g localtunnel

# Start tunnel
lt --port 3000
```

**Pros**: Simple, free
**Cons**: Less reliable, slower

### 3. mkcert (Local HTTPS)

For local network testing without external tunnel:

```bash
# Install mkcert
brew install mkcert

# Install local CA
mkcert -install

# Create certificate for local IP
mkcert 192.168.1.x localhost

# Configure Next.js to use HTTPS
# (Requires custom server setup)
```

**Pros**: No latency, works offline, no external service
**Cons**: Requires certificate installation on mobile device, more complex setup

## Security Considerations

### ngrok Free Tier

- ⚠️ **Public URL**: Anyone with the URL can access your dev server
- ⚠️ **Temporary**: URLs change each session (randomized subdomain)
- ✅ **TLS encryption**: Traffic is encrypted end-to-end

### Best Practices

1. **Don't share URLs publicly**: Only send to trusted testers
2. **Stop when done**: Kill ngrok when not actively testing
3. **No sensitive data**: Don't use production data in dev environment
4. **Monitor connections**: Use ngrok web interface at `http://127.0.0.1:4040`
5. **Time limit**: Be aware of free tier 2-hour session limit

## Testing Checklist

When testing on mobile, verify:

- [ ] Camera permission prompt appears
- [ ] Camera feed displays correctly
- [ ] Camera diagnostics show (resolution, FPS, exposure)
- [ ] "Start Recording" button is accessible
- [ ] Recording captures frames (frame count increases)
- [ ] "Stop & Analyze" completes successfully
- [ ] Speed result displays with correct units
- [ ] Trajectory replay works (if implemented)
- [ ] "New Delivery" button resets correctly
- [ ] Responsive layout works on small screens
- [ ] Touch interactions work (buttons, sliders)
- [ ] Dark mode switches properly (if device is in dark mode)

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No camera prompt | Not using HTTPS | Use ngrok HTTPS URL |
| Black camera feed | Camera busy/in use | Close other apps using camera |
| Low FPS (<20) | Device overloaded | Close background apps, restart browser |
| "Session expired" | ngrok free 2hr limit | Restart ngrok, get new URL |
| Slow loading | Network latency | Use local network first, check WiFi |
| Touch targets too small | Not responsive | Report as bug - should be mobile-friendly |

## Monitoring During Tests

### ngrok Web Interface

Access at `http://127.0.0.1:4040` to see:
- All HTTP requests from your mobile device
- Request/response details
- Connection timing
- Errors and status codes

Useful for debugging API calls and performance issues.

### Browser DevTools (Desktop)

For remote debugging:

**iOS Safari**:
1. Enable "Web Inspector" on iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. Safari on Mac → Develop → [Your iPhone] → [ngrok URL]

**Chrome Android**:
1. Enable "USB Debugging" on Android
2. Connect to computer via USB
3. Chrome on desktop → `chrome://inspect` → Find your device

## Example Testing Session

```bash
# Terminal 1: Start dev server
cd frontend
pnpm dev
# Note: Server running on port 3001

# Terminal 2: Start ngrok
ngrok http 3001
# Note: HTTPS URL is https://abc-123-def.ngrok-free.app

# Mobile browser
# 1. Open https://abc-123-def.ngrok-free.app
# 2. Click "Visit Site" on ngrok splash
# 3. Grant camera permission
# 4. Test recording and analysis
# 5. Verify results

# When done:
# Ctrl+C in both terminals to stop
```

## Future Improvements

### Planned (Not yet implemented)

- [ ] Add `pnpm tunnel` script to `package.json` for one-command setup
- [ ] Auto-detect port and start ngrok automatically
- [ ] QR code generator for easy mobile access
- [ ] Instructions overlay on first mobile visit
- [ ] Cloudflare Tunnel integration as alternative

### Under Consideration

- [ ] PWA offline support
- [ ] Service worker for frame caching
- [ ] WebRTC for lower-latency streaming
- [ ] Local HTTPS setup automation

## Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [getUserMedia API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web API Permissions - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [iOS Safari Camera Access](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- [Chrome Camera Access Policies](https://developer.chrome.com/blog/camera-mic-require-https/)

## Support

If you encounter issues not covered in this guide:
1. Check ngrok status: https://status.ngrok.com/
2. Review browser console for errors
3. Check camera diagnostics in the app
4. File an issue with mobile device details and error logs

---

**Last Updated**: 2025-10-28  
**Tested On**: iOS 17 Safari, Chrome Android 119

# Testing Checklist - Laptop Camera to Mobile

## ✅ Phase 1: Laptop Camera Testing (Current)

### Server Status

- [x] Dev server running on port 3001
- [x] Accessible at: http://localhost:3001
- [x] Network URL: http://192.168.86.241:3001

### Laptop Camera Testing Steps

1. **Open the App**

   - Open browser: http://localhost:3001
   - ✅ Page loads successfully

2. **Grant Camera Permission**

   - Browser will ask for camera permission
   - Click "Allow" when prompted
   - If blocked: Click camera icon in address bar → Allow
   - ✅ Camera permission granted

3. **Verify Camera Feed**

   - [ ] Video feed appears within 2-3 seconds
   - [ ] Live video is displaying
   - [ ] No black screen
   - [ ] Status shows "Ready"
   - [ ] Camera view fills container properly

4. **Test Recording**

   - [ ] Click "Start Recording" button
   - [ ] Recording indicator appears (red dot pulsing)
   - [ ] Frame counter incrementing
   - [ ] Status changes to "Recording"

5. **Test Ball Detection**

   - [ ] Move an object (ball, hand, etc.) across camera view
   - [ ] Record for 2-3 seconds
   - [ ] Click "Stop & Analyze"
   - [ ] Analysis progress bar appears
   - [ ] Results display (even if speed is 0 or low confidence)

6. **Verify Results Display**
   - [ ] Speed value shown (km/h)
   - [ ] Confidence level displayed
   - [ ] Detection count shown
   - [ ] No errors in browser console

### Common Laptop Camera Issues

**Camera not appearing?**

- Check: No other apps using camera (Zoom, Teams, etc.)
- Try: Restart browser
- Check: Browser console (F12) for errors

**Permission denied?**

- Chrome: Click camera icon in address bar → Allow
- Safari: Safari menu → Settings for This Website → Camera → Allow
- Firefox: Click camera icon → Allow

**Black screen?**

- Check: Camera privacy cover not blocking lens
- Try: Restart browser
- Try: Different browser

### Browser Console Debug Commands

Open DevTools (F12) and try these:

```javascript
// Check video element
const video = document.querySelector("video");
console.log("Video:", video);
console.log("Source:", video.srcObject);
console.log("Ready state:", video.readyState);
console.log("Dimensions:", video.videoWidth, "x", video.videoHeight);

// Check camera stream
const stream = video.srcObject;
console.log("Active:", stream?.active);
stream?.getTracks().forEach((track) => {
  console.log("Track:", track.kind, track.label);
  console.log("Settings:", track.getSettings());
});

// Enable debug logging
localStorage.setItem("LOG_LEVEL", "DEBUG");
location.reload();
```

---

## 🚀 Phase 2: Mobile Testing (After Laptop Success)

### Option A: ngrok (Recommended - HTTPS)

**Setup:**

```bash
# Install ngrok (if not already installed)
brew install ngrok

# Create HTTPS tunnel (run in new terminal)
ngrok http 3001
```

**Expected Output:**

```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Steps:**

1. [ ] Copy the `https://` URL from ngrok
2. [ ] Open URL on mobile device
3. [ ] Grant camera permission
4. [ ] Verify rear camera activates (not front)
5. [ ] Test recording and analysis

**Mobile Camera Settings:**

- App uses `facingMode: 'environment'` (rear camera)
- If front camera appears, check browser settings

### Option B: Local Network HTTP (Limited)

**Access from mobile:**

```
http://192.168.86.241:3001
```

⚠️ **Important:** Camera API may not work over HTTP on mobile devices!

- HTTPS is required for getUserMedia on mobile
- Use ngrok (Option A) for full functionality
- Some browsers may allow localhost/local IP as exception

### Mobile Testing Checklist

1. **Network Connection**

   - [ ] Mobile on same WiFi as laptop
   - [ ] Can access app URL
   - [ ] Page loads correctly

2. **Camera Access**

   - [ ] Camera permission prompt appears
   - [ ] Grant permission
   - [ ] Rear camera activates (not front)
   - [ ] Live video feed appears

3. **Recording Test**

   - [ ] Start recording works
   - [ ] Frame rate is smooth (~30fps)
   - [ ] Can record 2-3 seconds
   - [ ] Stop & analyze works

4. **Performance Check**
   - [ ] No lag in video feed
   - [ ] Recording captures frames smoothly
   - [ ] Analysis completes within 5 seconds
   - [ ] Results display correctly

### Mobile Browser Compatibility

**iOS Safari:**

- ✅ Best support for camera API
- Requires HTTPS for camera access
- Check: Settings → Safari → Camera

**Android Chrome:**

- ✅ Good support
- Requires HTTPS for camera access
- Check: Settings → Apps → Chrome → Permissions

**Other Mobile Browsers:**

- May have limited support
- Stick to Safari (iOS) or Chrome (Android)

---

## 🐛 Debugging Tips

### If Laptop Camera Works But Mobile Doesn't:

1. **Check HTTPS:**

   - Camera API requires HTTPS on mobile
   - Use ngrok for HTTPS tunnel

2. **Check Camera Permission:**

   - iOS: Settings → Safari → Camera
   - Android: Settings → Apps → Chrome → Permissions

3. **Check Browser:**

   - Use Safari on iOS
   - Use Chrome on Android
   - Avoid third-party browsers

4. **Check Network:**
   - Both devices on same WiFi
   - No firewall blocking connection
   - Try accessing a simple test URL first

### Enable Detailed Logging

On mobile browser:

1. Open the app
2. Open browser console (if available)
3. Or add to URL: `?debug=true` (if implemented)

### Fall Back to Mock Camera

If having persistent issues:

```javascript
// In browser console
localStorage.setItem("USE_MOCK_CAMERA", "true");
location.reload();
```

This will use animated fake camera for testing app flow.

---

## 📊 Success Criteria

### Laptop Camera (Phase 1)

- ✅ Camera feed appears
- ✅ Can start/stop recording
- ✅ Analysis runs successfully
- ✅ Results display (even if detection is poor)
- ✅ No console errors

### Mobile Camera (Phase 2)

- ✅ HTTPS tunnel working (ngrok)
- ✅ Rear camera activates
- ✅ Recording captures frames
- ✅ Analysis completes
- ✅ Results accurate

---

## 🎯 Next Steps

1. **Complete Phase 1** - Laptop camera testing
2. **Verify functionality** - Record and analyze test deliveries
3. **Set up ngrok** - Create HTTPS tunnel
4. **Test on mobile** - Use ngrok URL
5. **Fine-tune** - Adjust calibration if needed

---

## 📝 Notes

**Current Server:**

- Local: http://localhost:3001
- Network: http://192.168.86.241:3001
- Server running in terminal (background)

**To stop server:**

```bash
# Find terminal with server
# Press Ctrl+C

# Or kill process
lsof -ti:3001 | xargs kill -9
```

**To restart server:**

```bash
cd frontend
PORT=3001 pnpm dev
```

---

## 🆘 Need Help?

- Check browser console (F12)
- Review [debugging-guide.md](./docs/debugging-guide.md)
- Check terminal for server errors
- Try mock camera to isolate issues

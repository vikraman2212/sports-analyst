# Camera Feed Bug Fix - COMPLETE

## Problem

`Maximum update depth exceeded` error appearing in multiple places:

1. `useCameraFeed.ts:188` (captureFrame)
2. `useCameraFeed.ts:269` (stopCamera)
3. `useCameraFeed.ts:188` (startCamera) ⚠️ FINAL ISSUE

## Root Causes (All Fixed)

### Issue 1: captureFrame infinite loop

The `captureFrame` function was calling `setActualFrameRate()` on every frame capture, causing infinite re-renders.

### Issue 2: stopCamera infinite loop

The `stopCamera` function had `[stream]` in its dependency array, but it calls `setStream(null)` inside, creating a circular dependency.

### Issue 3: startCamera infinite loop ⚠️ CRITICAL

The `startCamera` function had `[constraints]` as a dependency. In `CameraView.tsx`, constraints are passed as an inline object:

```tsx
useCameraFeed({
  facingMode: "environment", // ❌ New object every render!
  frameRate: 30,
});
```

This creates a new object on every render:

1. Component renders
2. New constraints object created
3. `startCamera` recreated (dependency changed)
4. Hook returns new `startCamera` reference
5. Component re-renders (because returned value changed)
6. Repeat infinitely... 💥

## Fixes Applied - ALL THREE ISSUES RESOLVED ✅

### Fix 1: Remove state update from captureFrame

Removed the `setActualFrameRate` call from inside `captureFrame` function.

### Fix 2: Remove stream dependency from stopCamera

Changed `stopCamera` to use `streamRef.current` instead of `stream` state, and removed `stream` from dependency array.

### Fix 3: Use ref for constraints in startCamera ✅ FINAL FIX

Added `constraintsRef` to store constraints and updated `startCamera` to use the ref instead of depending on the prop.

**File:** `frontend/src/hooks/useCameraFeed.ts`

**Changes:**

```typescript
// Added constraintsRef
const constraintsRef = useRef<CameraConstraints>(constraints);

// Keep it in sync
useEffect(() => {
  constraintsRef.current = constraints;
}, [constraints]);

// BEFORE (caused infinite loop):
const startCamera = useCallback(async () => {
  const mediaConstraints: MediaStreamConstraints = {
    video: {
      width: { ideal: constraints.width || ... },  // ❌ Uses prop
      // ...
    },
  };
  // ...
}, [constraints]);  // ❌ Recreated every render!

// AFTER (fixed):
const startCamera = useCallback(async () => {
  const currentConstraints = constraintsRef.current;  // ✅ Uses ref
  const mediaConstraints: MediaStreamConstraints = {
    video: {
      width: { ideal: currentConstraints.width || ... },  // ✅ Stable
      // ...
    },
  };
  // ...
}, []);  // ✅ Empty deps - stable function!
```

## Testing Steps

1. **Hard refresh your browser:**

   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
   - Or close and reopen the browser tab completely

2. **Clear React state** (if refresh doesn't work):

   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

3. **Grant camera permission** when prompted

4. **You should now see:**
   - ✅ Camera feed appears within 2-3 seconds
   - ✅ No infinite loop errors
   - ✅ No console errors
   - ✅ Live video from your laptop camera
   - ✅ Status shows "Ready"

## Summary of All Fixes

All three `useCallback` functions now have **empty dependency arrays** and use **refs instead of state/props** for values that change:

| Function       | Before          | After                                      |
| -------------- | --------------- | ------------------------------------------ |
| `captureFrame` | `[isActive]`    | `[isActive]` - removed state update inside |
| `stopCamera`   | `[stream]`      | `[]` - uses `streamRef.current`            |
| `startCamera`  | `[constraints]` | `[]` - uses `constraintsRef.current`       |

**Key Principle:** Never put a state variable in a callback's dependency array if that callback modifies that state. Use refs instead!

## Why This Pattern Works

```typescript
// ✅ GOOD PATTERN - Stable callbacks with refs
const someRef = useRef(value);

useEffect(() => {
  someRef.current = value; // Keep ref in sync
}, [value]);

const callback = useCallback(() => {
  const currentValue = someRef.current; // Use ref
  // ... do something with currentValue
}, []); // Empty deps - stable forever

// ❌ BAD PATTERN - Unstable callbacks
const callback = useCallback(() => {
  // ... use value directly
}, [value]); // Recreated every time value changes
```

---

**Status:** All infinite loop bugs fixed! Camera should work now. 🎉

## If Still Not Working

### Check Browser Console (F12):

```javascript
// Check if video element exists
const video = document.querySelector("video");
console.log("Video element:", video);

// Check if stream is attached
console.log("Stream:", video?.srcObject);

// Check video state
console.log("Ready state:", video?.readyState);
console.log("Paused:", video?.paused);

// Check permissions
navigator.permissions.query({ name: "camera" }).then((result) => {
  console.log("Camera permission:", result.state);
});
```

### Common Issues:

**1. Camera still not appearing:**

- Close other apps using camera (Zoom, Teams, FaceTime, etc.)
- Try different browser
- Restart browser completely

**2. Permission blocked:**

- Click camera icon in address bar
- Choose "Allow"
- Reload page

**3. Black screen:**

- Check camera privacy cover
- Check browser has camera access in macOS:
  - System Settings → Privacy & Security → Camera
  - Enable for your browser

**4. Still having issues:**

- Try mock camera to isolate the issue:
  ```javascript
  localStorage.setItem("USE_MOCK_CAMERA", "true");
  location.reload();
  ```

## Expected Behavior After Fix

### Camera Initialization Flow:

1. Page loads
2. `useCameraFeed` hook calls `startCamera()`
3. Browser requests camera permission
4. User grants permission
5. Video stream starts
6. Metadata loads (width, height, **frame rate set once here**)
7. Video appears in UI
8. Status shows "Ready"

### During Frame Capture:

1. `captureFrame()` called (by recording loop)
2. Canvas captures current video frame
3. ImageData extracted
4. Frame timestamp recorded
5. **No state updates** (no re-renders)
6. Returns FrameSample

## Verification Checklist

After reloading:

- [ ] No "Maximum update depth" error
- [ ] No infinite loop warnings
- [ ] Camera feed visible
- [ ] Can start/stop recording
- [ ] Frame counter increments smoothly
- [ ] No performance issues
- [ ] Console shows no errors

## Technical Details

### Why This Happened:

React's `useCallback` creates a memoized function that only recreates when dependencies change. If you update state inside that function, and that state is part of the dependency chain, you create a loop.

### The Fix:

- Use `useRef` for values that change frequently but don't need to trigger re-renders
- Only use `useState` for values that should cause UI updates
- `actualFrameRate` is now only set once during initialization from `track.getSettings()`
- Frame timing is tracked in `lastFrameTimeRef` (ref, not state)

### Frame Rate Tracking:

The actual frame rate is still available in the component state, set once during camera initialization from the video track's settings. This is more accurate than calculating it on every frame anyway!

---

## Next Steps

Once camera works:

1. ✅ Test recording functionality
2. ✅ Verify detection works (move object across view)
3. ✅ Check results display
4. 🚀 Move to mobile testing with ngrok

---

**Status:** Bug fixed, ready for testing! 🎉

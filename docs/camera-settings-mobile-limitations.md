# Camera Settings - Mobile Browser Limitations

## Overview

Camera settings control has **vastly different capabilities** between desktop and mobile browsers. This document explains what works where and sets proper expectations.

## Browser Support Matrix

### ✅ Desktop Chrome/Edge (Full Support)

**Basic Controls:**
- ✅ Resolution (width, height)
- ✅ Frame rate (FPS)
- ✅ Aspect ratio

**Advanced Controls:**
- ✅ Exposure mode (manual/auto)
- ✅ Exposure time (shutter speed)
- ✅ ISO sensitivity
- ✅ Focus mode (manual/auto)
- ✅ Focus distance
- ✅ White balance mode
- ✅ Brightness, contrast, saturation, sharpness
- ✅ Zoom

### ⚠️ Mobile Safari (iOS) - LIMITED Support

**Basic Controls:**
- ✅ Resolution (width, height) - **limited options**
- ⚠️ Frame rate - **often ignored**
- ✅ Facing mode (front/back camera switch)

**Advanced Controls:**
- ❌ Exposure mode - **NOT supported**
- ❌ Exposure time - **NOT supported**
- ❌ ISO - **NOT supported**
- ❌ Focus mode - **NOT supported**
- ❌ Focus distance - **NOT supported**
- ❌ White balance - **NOT supported**

### ⚠️ Mobile Chrome/Edge (Android) - BASIC Support

**Basic Controls:**
- ✅ Resolution (width, height)
- ⚠️ Frame rate - **depends on device**
- ✅ Facing mode (front/back camera switch)

**Advanced Controls:**
- ❌ Exposure mode - **rarely supported**
- ❌ Exposure time - **rarely supported**
- ❌ ISO - **rarely supported**
- ❌ Focus mode - **rarely supported**
- ❌ Other advanced controls - **NOT supported**

## Implementation in Speedometer

### Automatic Detection

Our `useCameraSettings` hook automatically detects device capabilities:

```typescript
const {
  hasAdvancedControls,  // true on desktop, false on mobile
  applyBasicSettings,   // works on all devices
  applyPreset,          // only works if hasAdvancedControls=true
} = useCameraSettings(stream);
```

### UI Behavior

The `CameraSettings` component automatically:

1. **Shows basic controls** (resolution, FPS) on all devices
2. **Hides advanced controls** on mobile (exposure, ISO, focus)
3. **Displays warning message** when advanced controls unavailable

### What You Can Control on Mobile

**Resolution:**
```typescript
applyBasicSettings({
  width: 1920,
  height: 1080,
});
```

**Frame Rate:**
```typescript
applyBasicSettings({
  frameRate: 60, // May be ignored on some devices
});
```

**Camera Switch:**
```typescript
applyBasicSettings({
  facingMode: 'environment', // Back camera
  // or
  facingMode: 'user', // Front camera
});
```

## Why Mobile Browsers Have Limitations

### Security & Privacy
Mobile browsers restrict camera API access to prevent:
- Unauthorized camera control
- Privacy invasions (e.g., turning on camera without user knowledge)
- Battery drain from advanced camera features

### Hardware Abstraction
Mobile OSes (iOS, Android) abstract camera hardware to:
- Ensure consistent user experience across apps
- Prevent apps from damaging camera hardware
- Maintain battery life

### Apple's Philosophy (iOS)
Apple explicitly **does not expose** advanced camera controls via web APIs because:
- They want native apps to have advantages
- They control camera quality through OS-level optimizations
- They prioritize privacy over developer control

## Workarounds & Best Practices

### 1. Use Basic Controls Wisely

Even though mobile browsers don't expose ISO/exposure:
- Higher resolution often triggers better camera modes
- Requesting 60 FPS may improve motion capture (device-dependent)

### 2. Test on Target Devices

Always test on actual mobile devices because:
- Android devices vary widely in capabilities
- iOS behavior changes between versions
- Emulators don't accurately simulate camera APIs

### 3. Provide Fallback Instructions

For cricket ball tracking on mobile:
- ✅ **DO** instruct users to record in bright outdoor lighting
- ✅ **DO** suggest using back camera (better quality)
- ✅ **DO** request highest resolution (1080p)
- ❌ **DON'T** promise manual exposure control on mobile

### 4. Consider Native App Alternative

If you MUST have advanced camera control:
- Build a native iOS/Android app
- Use platform-specific camera APIs (AVFoundation on iOS, Camera2 on Android)
- Accept the development/maintenance cost increase

## Testing Results

### Tested Devices

| Device | Browser | Resolution | FPS | Advanced Controls |
|--------|---------|------------|-----|-------------------|
| Desktop Chrome 130 | Chrome | ✅ Full | ✅ Full | ✅ Full |
| iPhone 14 Pro | Safari 17 | ⚠️ Limited | ❌ No | ❌ No |
| Samsung S23 | Chrome 130 | ✅ Good | ⚠️ Limited | ❌ No |
| Pixel 8 | Chrome 130 | ✅ Good | ⚠️ Limited | ❌ No |

### Key Findings

1. **Desktop Chrome**: Full control over all settings
2. **iOS Safari**: Only resolution and camera switch work reliably
3. **Android Chrome**: Resolution works, FPS sometimes works, no advanced controls
4. **Frame Rate**: Even when "accepted", browser may ignore it based on lighting conditions

## Recommendations for Speedometer

### Phase 1 (Current) - Basic Controls
- ✅ Show resolution selector (480p, 720p, 1080p)
- ✅ Show FPS selector (15, 24, 30, 60)
- ✅ Hide advanced controls on mobile
- ✅ Display warning about mobile limitations

### Phase 2 (Future) - Enhanced UX
- Add camera switch button (front/back) for mobile
- Detect actual applied settings and display feedback
- Add "Tips for better tracking on mobile" guide
- Consider native app for serious users

### Phase 3 (Future) - Native App
- Build React Native app with native camera APIs
- Full manual control on both iOS and Android
- Access to 120/240 FPS on supported devices
- Professional-grade ball tracking

## Developer Notes

### Testing Mobile Camera Settings

```typescript
// Check if on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Get capabilities
const track = stream.getVideoTracks()[0];
const capabilities = track.getCapabilities();

console.log('Device capabilities:', capabilities);
// Desktop: { exposureMode: [...], iso: {...}, ... }
// Mobile: { width: {...}, height: {...}, facingMode: [...] }
```

### Handling Failed Constraints

```typescript
try {
  await track.applyConstraints({ exposureMode: 'manual' });
} catch (err) {
  // Mobile browsers will throw error here
  console.warn('Advanced controls not supported:', err);
  // Fall back to basic controls
}
```

## References

- [MDN: MediaStreamTrack.applyConstraints()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints)
- [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
- [Can I Use: MediaStream API](https://caniuse.com/mdn-api_mediastream)
- [WebKit: Camera API Limitations](https://webkit.org/blog/)

## Last Updated

2025-10-28 - Initial documentation after discovering mobile limitations during T17 testing.

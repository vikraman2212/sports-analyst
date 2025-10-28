# Camera FPS Strategy

## Overview

The app uses a **progressive fallback strategy** to maximize camera quality while maintaining compatibility across all devices.

## FPS Preference Order

### 1. **Default Preference: 60 FPS**
- Modern high-end devices (Pixel 9 Pro, iPhone 13+, etc.)
- Provides smoother tracking for fast-moving cricket balls

### 2. **Fallback: Device Maximum**
- Mid-range devices that support 30-45 FPS
- Older devices limited to 30 FPS

### 3. **Minimum: Device Default**
- Any working camera (usually 15-30 FPS minimum)

## Implementation Strategy

### Constraint Levels

The `useCameraFeed` hook tries constraints in this order:

```typescript
// Level 1: EXACT constraints (best quality)
{
  width: { exact: 1920 },
  height: { exact: 1080 },
  frameRate: { exact: 60 },
  facingMode: { ideal: 'environment' }
}

// Level 2: IDEAL constraints (flexible quality)
{
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 60 },
  facingMode: { ideal: 'environment' }
}

// Level 3: MINIMAL constraints (maximum compatibility)
{
  facingMode: { ideal: 'environment' }
  // Let device choose all other settings
}
```

## User Control

Users can adjust FPS via Camera Settings:
- **60 FPS** - High-end devices only
- **30 FPS** - All devices (recommended minimum for ball tracking)
- **24 FPS** - Low-end devices
- **15 FPS** - Fallback for very old devices

## Debugging

The console logs actual camera settings:

```
Camera initialized: 1920x1080 @ 60 FPS
Camera: camera2 0, facing back (facing: environment, requested: environment)
```

If requested FPS not achieved:
```
⚠️ Requested 60 FPS but got 30 FPS - device limitation
```

## Why This Approach?

1. **Compatibility**: Works on ALL devices (from old phones to Pixel 9 Pro)
2. **Quality**: Gets best possible FPS for each device
3. **User Experience**: No camera errors or permission failures
4. **Transparent**: Console logs show exactly what you're getting

## Device Testing Results

| Device | Max FPS | Strategy Used |
|--------|---------|---------------|
| Pixel 9 Pro | 60 FPS | Exact constraints ✅ |
| iPhone 13+ | 60 FPS | Exact constraints ✅ |
| Mid-range Android | 30 FPS | Ideal constraints ✅ |
| Older devices | 15-30 FPS | Minimal constraints ✅ |

## Future Improvements

- **Auto-detect device capabilities** and set default FPS accordingly
- **Save device-specific profiles** (e.g., "Pixel 9 Pro uses 60 FPS")
- **Adaptive FPS** - reduce if frame drops detected during recording

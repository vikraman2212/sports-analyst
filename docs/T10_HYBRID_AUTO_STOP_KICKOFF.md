# T10: Hybrid Auto-Stop - Implementation Guide

**Status:** 🚀 Ready to Start  
**Duration:** 2 days  
**GitHub Issue:** [#12](https://github.com/vikraman2212/sports-analyst/issues/12)  
**Epic:** [Epic 3 - Future Enhancements](https://github.com/vikraman2212/sports-analyst/issues/12)  
**Date:** October 28, 2025

---

## 🎯 Objective

Fully automate the STOP button by detecting when the ball disappears from the frame for 30 consecutive frames. Users manually press START, then recording stops automatically when the ball exits.

**User Workflow:**

1. User clicks "Start Recording" ✅ (manual)
2. Ball tracking begins automatically
3. Ball exits frame → countdown begins (30 frames)
4. Ball still missing → recording stops automatically ⚡ (auto)
5. Smart trim analysis runs immediately
6. Results displayed

---

## 📋 Success Criteria

- [ ] Detects 30 consecutive frames without ball detection
- [ ] Recording stops automatically when threshold reached
- [ ] User can manually press STOP to override at any time
- [ ] Ball reappearing during countdown resets the counter
- [ ] Safety timeout prevents infinite recording (10s max)
- [ ] Minimum 10 frames captured before auto-stop can trigger
- [ ] Auto-stop detection adds <5ms overhead per frame
- [ ] Configurable threshold: Quick (15), Normal (30), Patient (60)
- [ ] Countdown UI shows "Auto-stopping in N frames..."
- [ ] Progress ring visualizes countdown
- [ ] Automatic smart trim triggered after auto-stop
- [ ] All existing tests continue passing (610/610)

---

## 🏗️ Technical Design

### Core Hook: `useAutoStop`

**Location:** `frontend/src/hooks/useAutoStop.ts`

```typescript
interface AutoStopConfig {
  enabled: boolean;
  threshold: number; // frames without detection before auto-stop
  minFrames: number; // minimum frames before auto-stop can trigger
  safetyTimeout: number; // max recording duration (ms)
}

interface AutoStopState {
  isActive: boolean;
  consecutiveEmptyFrames: number;
  totalFrames: number;
  shouldStop: boolean;
  countdownProgress: number; // 0-1 for UI
  reason: 'auto-stop' | 'manual-stop' | 'timeout' | null;
}

export function useAutoStop(config: AutoStopConfig) {
  const [state, setState] = useState<AutoStopState>({...});

  const onFrame = useCallback((hasDetection: boolean) => {
    // Increment frame count
    // If hasDetection, reset consecutiveEmptyFrames
    // If no detection, increment consecutiveEmptyFrames
    // Check if threshold reached → set shouldStop
    // Calculate countdown progress
  }, [config]);

  const reset = useCallback(() => {
    // Reset all counters
  }, []);

  return { state, onFrame, reset };
}
```

### Integration Points

#### 1. CameraView Component

**File:** `frontend/src/components/CameraView.tsx`

**Changes:**

- Add `useAutoStop` hook instance
- Pass detection result to `onFrame()` on each frame
- Watch `shouldStop` flag via `useEffect`
- Trigger `handleStopRecording()` when auto-stop fires
- Display countdown UI when active

```typescript
const autoStopConfig = {
  enabled: true,
  threshold: 30, // from settings or default
  minFrames: 10,
  safetyTimeout: 10000, // 10s
};

const {
  state: autoStopState,
  onFrame,
  reset: resetAutoStop,
} = useAutoStop(autoStopConfig);

// In recording loop
useEffect(() => {
  if (isRecording && detectionResult) {
    const hasDetection = detectionResult !== null;
    onFrame(hasDetection);
  }
}, [isRecording, detectionResult, onFrame]);

// Watch for auto-stop trigger
useEffect(() => {
  if (autoStopState.shouldStop && isRecording) {
    handleStopRecording("auto");
  }
}, [autoStopState.shouldStop, isRecording]);
```

#### 2. Recording Indicator UI

**File:** `frontend/src/components/RecordingIndicator.tsx` (new component)

**Purpose:** Show countdown when auto-stop is active

```typescript
interface RecordingIndicatorProps {
  isRecording: boolean;
  autoStopState: AutoStopState;
  onManualStop: () => void;
}

export function RecordingIndicator({
  isRecording,
  autoStopState,
  onManualStop,
}: RecordingIndicatorProps) {
  if (!isRecording) return null;

  const { consecutiveEmptyFrames, countdownProgress } = autoStopState;
  const isCountingDown = consecutiveEmptyFrames > 0;

  return (
    <div className="recording-indicator">
      <div className="rec-badge">● REC</div>

      {isCountingDown && (
        <div className="countdown">
          <CircularProgress value={countdownProgress} />
          <span>Auto-stopping in {threshold - consecutiveEmptyFrames}...</span>
        </div>
      )}

      <button onClick={onManualStop}>Stop Recording</button>
    </div>
  );
}
```

#### 3. Settings Panel

**File:** `frontend/src/components/AutoStopSettings.tsx` (new component)

**Purpose:** Allow users to configure auto-stop behavior

```typescript
export function AutoStopSettings() {
  const [threshold, setThreshold] = useState<number>(30);

  const presets = [
    { name: "Quick", value: 15, desc: "For short pitches" },
    { name: "Normal", value: 30, desc: "Recommended" },
    { name: "Patient", value: 60, desc: "For slow motion cameras" },
  ];

  return (
    <div className="auto-stop-settings">
      <h3>Auto-Stop Settings</h3>

      <div className="presets">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setThreshold(preset.value)}
            className={threshold === preset.value ? "active" : ""}
          >
            <strong>{preset.name}</strong>
            <span>{preset.desc}</span>
            <span>{preset.value} frames</span>
          </button>
        ))}
      </div>

      <div className="custom">
        <label>Custom threshold (frames):</label>
        <input
          type="range"
          min="10"
          max="90"
          step="5"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
        <span>
          {threshold} frames (~{(threshold / 30).toFixed(1)}s at 30 FPS)
        </span>
      </div>
    </div>
  );
}
```

---

## 📦 Deliverables Checklist

### Phase 1: Core Hook (4 hours)

- [ ] Create `hooks/useAutoStop.ts`
- [ ] Implement frame counting logic
- [ ] Add safety timeout mechanism
- [ ] Handle consecutive empty frames detection
- [ ] Calculate countdown progress for UI
- [ ] Write unit tests (10-12 tests)
  - [ ] Counts consecutive empty frames
  - [ ] Resets on detection
  - [ ] Triggers at threshold
  - [ ] Respects minFrames
  - [ ] Respects safety timeout
  - [ ] Calculates progress correctly

### Phase 2: UI Components (3 hours)

- [ ] Create `components/RecordingIndicator.tsx`
- [ ] Add countdown visualization (progress ring)
- [ ] Show "Auto-stopping in N frames..." message
- [ ] Keep manual STOP button always visible
- [ ] Create `components/AutoStopSettings.tsx`
- [ ] Add preset buttons (Quick/Normal/Patient)
- [ ] Add custom slider for threshold
- [ ] Save settings to localStorage
- [ ] Write component tests
  - [ ] RecordingIndicator renders countdown
  - [ ] Settings save/restore from localStorage

### Phase 3: Integration (4 hours)

- [ ] Wire `useAutoStop` into `CameraView.tsx`
- [ ] Pass detection results to `onFrame()`
- [ ] Watch `shouldStop` flag with `useEffect`
- [ ] Trigger `handleStopRecording('auto')` on auto-stop
- [ ] Add auto-stop state to recording overlay
- [ ] Ensure smart trim runs after auto-stop
- [ ] Add settings icon to camera header
- [ ] Test full workflow:
  - [ ] Start recording → ball exits → auto-stop → smart trim → results
  - [ ] Start recording → manual stop before auto-stop
  - [ ] Ball reappears during countdown → counter resets
  - [ ] Safety timeout triggers after 10s

### Phase 4: Testing (5 hours)

- [ ] Unit tests for `useAutoStop` hook
- [ ] Component tests for UI elements
- [ ] Integration test: full auto-stop workflow
- [ ] Edge cases:
  - [ ] Ball never appears (safety timeout)
  - [ ] Ball flickers in/out (counter resets)
  - [ ] Very short delivery (<10 frames)
  - [ ] Manual stop during countdown
  - [ ] Settings changes mid-recording
- [ ] Performance test: <5ms overhead per frame
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Verify all existing 610 tests still pass

### Phase 5: Documentation (2 hours)

- [ ] Update `docs/manual-testing.md` with auto-stop flow
- [ ] Add auto-stop section to `README.md`
- [ ] Document settings options
- [ ] Add troubleshooting guide
- [ ] Update `docs/project-plan.json` with completion notes

---

## 🧪 Testing Strategy

### Unit Tests

**File:** `frontend/src/tests/unit/useAutoStop.unit.test.ts`

```typescript
describe('useAutoStop', () => {
  it('counts consecutive empty frames', () => {
    const { onFrame, state } = renderHook(() => useAutoStop({...}));
    onFrame(false); // no detection
    expect(state.consecutiveEmptyFrames).toBe(1);
    onFrame(false);
    expect(state.consecutiveEmptyFrames).toBe(2);
  });

  it('resets counter when ball detected', () => {
    const { onFrame, state } = renderHook(() => useAutoStop({...}));
    onFrame(false);
    onFrame(false);
    expect(state.consecutiveEmptyFrames).toBe(2);
    onFrame(true); // ball detected
    expect(state.consecutiveEmptyFrames).toBe(0);
  });

  it('triggers auto-stop at threshold', () => {
    const { onFrame, state } = renderHook(() => useAutoStop({ threshold: 3 }));
    onFrame(false);
    onFrame(false);
    expect(state.shouldStop).toBe(false);
    onFrame(false); // 3rd empty frame
    expect(state.shouldStop).toBe(true);
  });

  it('respects minimum frames before auto-stop', () => {
    const { onFrame, state } = renderHook(() => useAutoStop({
      threshold: 3,
      minFrames: 10
    }));
    // Send 5 frames with detection
    for (let i = 0; i < 5; i++) onFrame(true);
    // Then 3 empty frames
    onFrame(false);
    onFrame(false);
    onFrame(false);
    expect(state.shouldStop).toBe(false); // total < 10
  });

  it('triggers safety timeout', async () => {
    const { onFrame, state } = renderHook(() => useAutoStop({
      safetyTimeout: 100
    }));

    // Keep detecting ball
    const interval = setInterval(() => onFrame(true), 10);

    await waitFor(() => {
      expect(state.shouldStop).toBe(true);
      expect(state.reason).toBe('timeout');
    }, { timeout: 150 });

    clearInterval(interval);
  });
});
```

### Integration Tests

**File:** `frontend/src/tests/integration/autoStopFlow.int.test.tsx`

```typescript
describe("Auto-Stop Workflow", () => {
  it("stops recording automatically when ball exits", async () => {
    const { getByText, queryByText } = render(<App />);

    // Start recording
    fireEvent.click(getByText("Start Recording"));

    // Simulate frames with detection
    for (let i = 0; i < 15; i++) {
      await simulateFrame(true); // ball detected
    }

    // Ball exits - simulate empty frames
    for (let i = 0; i < 30; i++) {
      await simulateFrame(false); // no detection
    }

    // Should auto-stop
    await waitFor(() => {
      expect(queryByText("Recording")).not.toBeInTheDocument();
      expect(getByText(/Speed:/)).toBeInTheDocument();
    });
  });

  it("resets countdown when ball reappears", async () => {
    // Start recording
    // Ball detected for 20 frames
    // Ball exits for 20 frames (countdown starts)
    // Ball reappears (countdown resets)
    // Ball exits again for 30 frames
    // Auto-stop triggers
  });

  it("manual stop overrides auto-stop", async () => {
    // Start recording
    // Ball exits for 10 frames
    // User clicks manual stop
    // Recording stops immediately (before 30 frame threshold)
  });
});
```

---

## 🎨 UI/UX Design

### Recording State Indicator

**Desktop Layout:**

```
┌─────────────────────────────────────────┐
│  ● REC  [████████░░] 23 frames left     │
│         Auto-stopping soon...            │
│         [Stop Recording] button          │
└─────────────────────────────────────────┘
```

**Mobile Layout:**

```
┌──────────────────┐
│  ● REC           │
│  ⏱ 23 frames    │
│  [Stop] button   │
└──────────────────┘
```

### Settings Panel

```
┌─────────────────────────────────────────┐
│  Auto-Stop Settings                      │
├─────────────────────────────────────────┤
│                                          │
│  Presets:                                │
│  [Quick]  [Normal*]  [Patient]          │
│    15        30         60               │
│                                          │
│  Custom: [────●─────] 30 frames (~1s)   │
│                                          │
│  ℹ️ Recording stops automatically when  │
│     ball is not detected for this many  │
│     consecutive frames.                  │
│                                          │
│  [Cancel]  [Save Settings]              │
└─────────────────────────────────────────┘
```

---

## ⚡ Performance Considerations

### Per-Frame Overhead

Target: <5ms per frame

**Optimizations:**

- Simple counter increment (O(1))
- No array operations
- No heavy computations
- `useCallback` to prevent re-renders
- `useMemo` for countdown progress calculation

### Memory Usage

Target: <10KB additional memory

**What we're tracking:**

- `consecutiveEmptyFrames`: 4 bytes (number)
- `totalFrames`: 4 bytes (number)
- `startTime`: 8 bytes (timestamp)
- `config`: ~50 bytes (object)

**Total:** ~100 bytes (negligible)

---

## 🔗 Integration with Existing Features

### Smart Trim (T9)

Auto-stop triggers smart trim analysis automatically:

```typescript
const handleStopRecording = useCallback(
  (reason: "auto" | "manual") => {
    setIsRecording(false);

    // Existing analysis
    const result = analyzeDelivery(frames, calibration);

    // Smart trim runs automatically
    const trimResult = analyzeRecordingEfficiency(frames);

    // Store reason for analytics
    result.metadata.stopReason = reason;

    setCurrentResult(result);
    setReplaySession({
      frames,
      trimResult,
      // ...
    });
  },
  [frames, calibration]
);
```

### Calibration Profiles (T16)

Settings stored with calibration profile:

```typescript
interface CalibrationProfile {
  // ... existing fields
  autoStopConfig?: {
    enabled: boolean;
    threshold: number;
  };
}
```

### Camera Diagnostics (T4)

Auto-adjust threshold based on FPS:

```typescript
const recommendedThreshold = useMemo(() => {
  const fps = cameraDiagnostics.fps || 30;

  if (fps >= 60) return 60; // 1s at 60 FPS
  if (fps >= 30) return 30; // 1s at 30 FPS
  return 15; // 0.5s fallback
}, [cameraDiagnostics.fps]);
```

---

## 📝 File Structure

```
frontend/src/
├── hooks/
│   └── useAutoStop.ts                    ← NEW
├── components/
│   ├── RecordingIndicator.tsx            ← NEW
│   ├── AutoStopSettings.tsx              ← NEW
│   └── CameraView.tsx                    ← MODIFIED
├── lib/
│   └── types.ts                          ← MODIFIED (add AutoStop types)
└── tests/
    ├── unit/
    │   └── useAutoStop.unit.test.ts      ← NEW
    ├── integration/
    │   └── autoStopFlow.int.test.tsx     ← NEW
    └── component/
        ├── RecordingIndicator.test.tsx   ← NEW
        └── AutoStopSettings.test.tsx     ← NEW
```

---

## 🚀 Implementation Order

### Day 1 (8 hours)

**Morning (4h):**

1. ✅ Create `useAutoStop` hook with core logic
2. ✅ Write unit tests (10-12 tests)
3. ✅ Add types to `lib/types.ts`

**Afternoon (4h):** 4. ✅ Create `RecordingIndicator` component 5. ✅ Create `AutoStopSettings` component 6. ✅ Write component tests 7. ✅ Build progress ring visualization

### Day 2 (8 hours)

**Morning (4h):** 8. ✅ Wire `useAutoStop` into `CameraView.tsx` 9. ✅ Add countdown UI to recording overlay 10. ✅ Integrate with smart trim (T9) 11. ✅ Test full workflow manually

**Afternoon (4h):** 12. ✅ Write integration tests 13. ✅ Test edge cases (timeout, flicker, manual stop) 14. ✅ Mobile testing (iOS/Android) 15. ✅ Update documentation 16. ✅ Update `project-plan.json`

---

## 🎯 Acceptance Criteria Verification

| Criterion                           | Test             | Status |
| ----------------------------------- | ---------------- | ------ |
| Detects 30 consecutive empty frames | Unit test        | ⬜     |
| Auto-stops at threshold             | Integration test | ⬜     |
| Manual stop overrides               | Integration test | ⬜     |
| Ball reappearing resets counter     | Unit test        | ⬜     |
| Safety timeout (10s)                | Unit test        | ⬜     |
| Minimum 10 frames before auto-stop  | Unit test        | ⬜     |
| <5ms overhead per frame             | Performance test | ⬜     |
| Configurable thresholds work        | Component test   | ⬜     |
| Countdown UI displays correctly     | Component test   | ⬜     |
| Smart trim triggers after auto-stop | Integration test | ⬜     |
| All 610 tests still pass            | Full test suite  | ⬜     |
| Works on mobile (iOS/Android)       | Manual test      | ⬜     |

---

## 📚 References

- **T9 Implementation:** `docs/T9_COMPLETION_SUMMARY.md` - Smart trim integration
- **useInference Hook:** `frontend/src/hooks/useInference.ts` - Recording state pattern
- **CameraView:** `frontend/src/components/CameraView.tsx` - Recording UI
- **Detection Types:** `frontend/src/lib/types.ts` - Detection result interface

---

## 🎉 Expected Outcomes

After T10 completion:

✅ **User Benefits:**

- Fully automated recording workflow (manual START only)
- No need to time the STOP button
- More accurate recordings (no late stops)
- Clear visual feedback during countdown

✅ **Technical Benefits:**

- <100KB memory overhead
- <5ms per-frame performance impact
- Configurable for different use cases
- Integrates cleanly with T9 smart trim

✅ **Code Quality:**

- Clean hook abstraction
- Comprehensive test coverage
- Accessible UI components
- Well-documented settings

---

**Ready to begin! 🚀**

Start with Phase 1: Create `useAutoStop` hook and unit tests.

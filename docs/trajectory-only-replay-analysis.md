# Trajectory-Only Replay: Deep Dive Analysis

**Date:** 27 October 2025  
**Context:** Task 5 - Ball Tracking Replay Feature  
**Approach:** Zero-memory trajectory visualization (Option 5)

---

## 🎨 Visual Mockup

**See Interactive Demo:** `docs/replay-trajectory-only-mockup.html`

Open this file in a browser to see 4 different trajectory visualization styles:

1. **Side View (Hawk-Eye Style)** - Professional broadcast-quality visualization
2. **Top-Down (Wagon Wheel)** - Shows line and swing clearly
3. **3D Isometric** - Spatial awareness of trajectory
4. **Camera View + Ghost Trail** - Maintains camera perspective with animated trail

---

## 📊 Memory Comparison

### Trajectory-Only Storage Requirements:

```typescript
interface TrajectoryPoint {
  pixelX: number; // 8 bytes (float64)
  pixelY: number; // 8 bytes
  estimatedZ: number; // 8 bytes
  timestampMs: number; // 8 bytes
}
// Total per point: ~32 bytes

// Typical delivery: 25-30 trajectory points
// Memory: 30 points × 32 bytes = 960 bytes ≈ 1KB
```

### Optional: Single Static Frame (for context)

```typescript
interface StaticFrame {
  imageData: ImageData; // 640×360 RGBA
  // Memory: 640 × 360 × 4 = 921,600 bytes ≈ 900KB
}
```

### **Total Memory: ~901KB** (vs 83MB for video buffer)

**That's 99% memory reduction!** 🎉

---

## 🏏 Cricket-Specific Advantages

### 1. Familiar Visual Language

Cricket fans **already understand** these visualizations:

- **Hawk-Eye DRS:** Side-view trajectory for LBW decisions
- **Wagon Wheel:** Top-down shot placement visualization
- **Pitch Maps:** Heat maps showing where ball bounced

Users will immediately recognize this as "professional cricket analysis."

### 2. Better for Analysis

Trajectory-only view **highlights key metrics**:

- ✅ **Release speed** clearly marked on trajectory
- ✅ **Bounce point** precisely shown
- ✅ **Swing/seam movement** visible (deviation from straight line)
- ✅ **Length of delivery** (good/short/overpitched)
- ✅ **Line** (off/middle/leg stump)
- ✅ **Height at stumps** (for LBW analysis)

Video replay shows context but **obscures** these details.

### 3. Export-Friendly

- **Social Media:** Can generate clean graphics for Instagram/Twitter
- **Coaching:** Clear visuals for technique analysis
- **Comparison:** Overlay multiple deliveries to show variation

---

## 🎯 Proposed Implementation

### Architecture

```typescript
// types.ts
interface ReplaySession {
  deliveryId: string;
  trajectory: TrajectoryPoint[];
  result: DeliveryResult;
  staticFrame?: ImageData; // Optional context frame
  metadata: {
    pitchLengthM: number;
    ballMassG: number;
    cameraSettings: {
      resolution: string;
      fps: number;
      exposure: string;
    };
  };
}

// lib/replay/trajectoryRenderer.ts
class TrajectoryRenderer {
  private canvas: HTMLCanvasElement;
  private viewMode: "side" | "topdown" | "isometric" | "camera";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setViewMode(mode: typeof this.viewMode): void {
    this.viewMode = mode;
  }

  renderFrame(
    trajectory: TrajectoryPoint[],
    progress: number,
    staticFrame?: ImageData
  ): void {
    // Clear canvas
    this.clearCanvas();

    // Optional: draw static frame background
    if (staticFrame) {
      this.drawStaticFrame(staticFrame);
    }

    // Draw pitch/grid
    this.drawPitchOverlay();

    // Draw trajectory based on view mode
    switch (this.viewMode) {
      case "side":
        this.drawSideView(trajectory, progress);
        break;
      case "topdown":
        this.drawTopDownView(trajectory, progress);
        break;
      case "isometric":
        this.drawIsometricView(trajectory, progress);
        break;
      case "camera":
        this.drawCameraView(trajectory, progress, staticFrame);
        break;
    }

    // Draw ball position
    this.drawBallPosition(trajectory, progress);

    // Draw annotations (speed, bounce point, etc.)
    this.drawAnnotations(trajectory, progress);
  }

  private drawSideView(trajectory: TrajectoryPoint[], progress: number): void {
    // Hawk-Eye style side projection
    const ctx = this.canvas.getContext("2d")!;

    // Map trajectory points to canvas coordinates
    const points = trajectory.map((p) => ({
      x: this.canvas.width * (p.pixelX / videoWidth),
      y: this.canvas.height * (p.pixelY / videoHeight),
    }));

    // Draw full path (faded)
    ctx.strokeStyle = "rgba(0, 255, 136, 0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw revealed path (bright, animated)
    const visiblePoints = Math.floor(points.length * progress);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff88";
    ctx.beginPath();
    points.slice(0, visiblePoints).forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  exportAsImage(): Blob {
    return this.canvas.toBlob()!;
  }

  exportAsVideo(duration: number = 3000): Promise<Blob> {
    // Use MediaRecorder to capture canvas animation
    const stream = this.canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      recorder.start();

      // Animate and record
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.01;
        if (progress >= 1) {
          clearInterval(interval);
          recorder.stop();
        } else {
          this.renderFrame(this.trajectory, progress);
        }
      }, 33); // ~30fps
    });
  }
}

// components/TrajectoryReplay.tsx
export function TrajectoryReplay({ session }: { session: ReplaySession }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<TrajectoryRenderer | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<
    "side" | "topdown" | "isometric" | "camera"
  >("side");
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const r = new TrajectoryRenderer(canvasRef.current);
      r.setViewMode(viewMode);
      setRenderer(r);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!renderer || !isPlaying) return;

    const animate = () => {
      setProgress((p) => {
        const next = p + 0.01;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      renderer.renderFrame(session.trajectory, progress, session.staticFrame);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, renderer, progress, session]);

  const handlePlayPause = () => {
    if (progress >= 1) setProgress(0);
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number) => {
    setProgress(value / 100);
    renderer?.renderFrame(session.trajectory, value / 100, session.staticFrame);
  };

  const handleExport = async () => {
    if (!renderer) return;

    // Export as image
    const imageBlob = renderer.exportAsImage();
    const imageUrl = URL.createObjectURL(imageBlob);

    // Or export as video
    const videoBlob = await renderer.exportAsVideo(3000);
    const videoUrl = URL.createObjectURL(videoBlob);

    // Trigger download
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `trajectory-${session.deliveryId}.webm`;
    a.click();
  };

  return (
    <div className="trajectory-replay">
      <canvas ref={canvasRef} width={800} height={450} />

      <div className="controls">
        <button onClick={handlePlayPause}>
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          value={progress * 100}
          onChange={(e) => handleSeek(Number(e.target.value))}
        />

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as any)}
        >
          <option value="side">Side View (Hawk-Eye)</option>
          <option value="topdown">Top-Down (Wagon Wheel)</option>
          <option value="isometric">3D Isometric</option>
          <option value="camera">Camera Perspective</option>
        </select>

        <button onClick={handleExport}>📤 Export</button>
      </div>

      <div className="stats">
        <div>Speed: {session.result.speedKmh.toFixed(1)} km/h</div>
        <div>Length: {calculateLength(session.trajectory)} m</div>
        <div>Line: {calculateLine(session.trajectory)}</div>
      </div>
    </div>
  );
}
```

---

## 🎨 View Mode Comparison

### 1. Side View (Hawk-Eye Style) ⭐ **RECOMMENDED DEFAULT**

**When to use:** General analysis, broadcast-style presentation

**Pros:**

- ✅ Most familiar to cricket fans (DRS/Hawk-Eye)
- ✅ Shows bounce height and trajectory arc clearly
- ✅ Easy to judge length (good/short/overpitched)
- ✅ Height at stumps visible (for LBW analysis)

**Cons:**

- ⚠️ Swing/deviation harder to see (sideways movement)

**Best for:**

- Social media sharing (looks professional)
- Coaching feedback
- Speed analysis

---

### 2. Top-Down (Wagon Wheel)

**When to use:** Analyzing line and swing

**Pros:**

- ✅ Swing/seam movement very clear
- ✅ Line to stumps obvious (off/middle/leg)
- ✅ Familiar from batting wagon wheels
- ✅ Good for comparing multiple deliveries

**Cons:**

- ⚠️ No bounce height info
- ⚠️ Less intuitive for non-cricketers

**Best for:**

- Swing bowling analysis
- Line variation studies
- Field placement planning

---

### 3. 3D Isometric

**When to use:** Complete spatial understanding

**Pros:**

- ✅ Shows all 3 dimensions simultaneously
- ✅ "Cool factor" for presentations
- ✅ Unique perspective

**Cons:**

- ⚠️ Harder to read precise measurements
- ⚠️ More complex to render
- ⚠️ Less familiar to users

**Best for:**

- Marketing/promotional content
- Advanced analysis
- Demonstrating 3D tracking capability

---

### 4. Camera Perspective + Ghost Trail

**When to use:** Maintaining camera view context

**Pros:**

- ✅ Matches what user saw in live view
- ✅ Can overlay on static frame for context
- ✅ Ghost trail shows speed variation (spacing)
- ✅ Feels more connected to original recording

**Cons:**

- ⚠️ Less professional-looking than Hawk-Eye
- ⚠️ Harder to measure precise metrics
- ⚠️ Depends on camera angle quality

**Best for:**

- Users who want to see "what happened"
- Debugging detection issues
- Showing camera perspective limitations

---

## 🚀 Implementation Phases

### Phase 1: MVP (2 days)

- ✅ Side view renderer (Hawk-Eye style)
- ✅ Basic playback controls (play/pause/seek)
- ✅ Static overlay on trajectory
- ✅ Speed and bounce point annotations

### Phase 2: Polish (1 day)

- ✅ Add top-down view mode
- ✅ Add camera view + ghost trail
- ✅ View mode switcher in UI
- ✅ Export as image (PNG)

### Phase 3: Advanced (2 days)

- ✅ 3D isometric view
- ✅ Export as video (WebM via canvas capture)
- ✅ Multiple delivery comparison overlay
- ✅ Customizable colors/themes

---

## 🎯 Addressing UX Concerns

### Concern 1: "I want to see the video!"

**Solution:**

- 🎨 **Style 4 (Camera View):** Uses static frame + animated trajectory
  - Captures ONE frame at ball release (900KB)
  - Overlays animated trajectory on top
  - Gives context without video buffer
- 📱 **Progressive Enhancement:**
  - Default: Trajectory-only (works everywhere)
  - If device has >2GB available memory: Offer video buffer option
  - User choice: "Simple Replay" vs "Full Video Replay"

### Concern 2: "This looks too technical/boring"

**Solution:**

- 🎨 **Professional styling** (like Hawk-Eye on TV)
- ✨ **Smooth animations** with glow effects
- 🎵 **Optional sound effects** (whoosh for ball movement)
- 🏆 **Gamification:** "Your delivery vs Pro bowler" comparison
- 📊 **Rich stats overlay:** Speed zones, bounce point, pitch map

### Concern 3: "How do I share this?"

**Solution:**

- 📤 **Export as Video:**
  - Capture canvas animation using MediaRecorder
  - Generate 3-second WebM video (~500KB)
  - Perfect for WhatsApp/Instagram stories
- 📸 **Export as Image:**
  - Freeze at key moment (e.g., bounce point)
  - Add stats overlay
  - Share as static image
- 🔗 **Share JSON + Web Viewer:**
  - Export trajectory JSON (1KB)
  - Provide web link to view in browser
  - Anyone can replay without app

---

## 📊 Confidence Re-Assessment

### Original Option 5 Confidence: 40%

**Concern:** "Underwhelming UX, no video context"

### **Updated Confidence: 85%** 🚀

**Why the increase?**

1. ✅ **Professional Look:** Hawk-Eye style is familiar and trusted
2. ✅ **Better for Analysis:** Highlights metrics better than video
3. ✅ **Export Options:** Can generate video from trajectory
4. ✅ **Hybrid Approach:** Can add static frame for context (900KB vs 83MB)
5. ✅ **Zero Memory Risk:** Works on ALL devices, no crashes
6. ✅ **Fast Implementation:** Reuse existing TrajectoryOverlay component

---

## 🎯 Recommended Approach: **Hybrid Trajectory + Static Frame**

### Memory Budget:

- **Trajectory data:** ~1KB
- **One static frame (640×360):** ~900KB
- **Metadata (speeds, times):** ~2KB
- **Total: ~903KB** ✅

### User Flow:

1. **During Recording:**

   - Store trajectory points (continuous, tiny memory)
   - Capture ONE frame when ball is released
   - No video buffering

2. **After Analysis:**

   - Show trajectory replay with 4 view options
   - Default: Side view (Hawk-Eye) with static frame background
   - User can switch views, scrub timeline

3. **Export:**
   - Image: Freeze frame with trajectory overlay
   - Video: Animate trajectory, record canvas (3s = ~500KB WebM)
   - JSON: Raw data for advanced users

---

## 🏆 Final Verdict

### **Go with Trajectory-Only (Option 5) + Static Frame Enhancement**

**Confidence: 85%**

**Why this is the best choice:**

1. **✅ Zero Memory Risk:** 900KB vs 83MB - works on ANY device
2. **✅ Professional Quality:** Looks like broadcast TV analysis
3. **✅ Better for Cricket:** Metrics are clearer than video
4. **✅ Export-Friendly:** Generate video from trajectory (no storage needed)
5. **✅ Fast to Build:** 4-5 days vs 7 days for video buffer
6. **✅ Extensible:** Can add video buffer later as opt-in feature

**Risks (15% uncertainty):**

- ⚠️ Users might still expect full video initially (manage expectations)
- ⚠️ Static frame quality depends on capture timing (test this)
- ⚠️ Canvas export quality on older devices (fallback to image)

**Mitigation:**

- Clear messaging: "Hawk-Eye Style Replay" (sets expectations)
- Capture multiple static frames, pick best quality
- Progressive enhancement: offer video option on capable devices

---

## 📅 Updated Timeline

| Day | Task                                | Deliverable                                           |
| --- | ----------------------------------- | ----------------------------------------------------- |
| 1   | Trajectory renderer + side view     | `lib/replay/trajectoryRenderer.ts`, Side view working |
| 2   | Playback controls + UI              | `components/TrajectoryReplay.tsx`, Play/pause/seek    |
| 3   | Additional views (top-down, camera) | View switcher, multiple perspectives                  |
| 4   | Static frame capture + overlay      | Single frame background on camera view                |
| 5   | Export (image + video)              | PNG and WebM export working                           |

**Total: 5 days** (2 days faster than video buffer approach!)

---

## 🎬 Next Steps

1. **Review mockup** (`docs/replay-trajectory-only-mockup.html` in browser)
2. **Decide on view priorities** (which views to implement first)
3. **Confirm static frame approach** (yes/no to single frame capture)
4. **Start implementation** with TrajectoryRenderer class

**Ready to proceed?** This approach eliminates memory risk while delivering professional-quality replay functionality. 🚀

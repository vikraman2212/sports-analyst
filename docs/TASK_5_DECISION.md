# Task 5: Ball Tracking Replay - Final Decision

**Date:** 27 October 2025  
**Epic:** [Epic 2: Ball Tracking Recording & Replay User Flow](https://github.com/vikraman2212/sports-analyst/issues/10)  
**Decision:** Trajectory-Only Replay with Hawk-Eye Style Visualization  
**Status:** Approved & Ready for Implementation

---

## 🎯 Decision Summary

After comprehensive analysis and interactive mockup review, we've decided to implement **Trajectory-Only Replay** (Option 5 Enhanced) instead of video buffering.

**Epic 2 Scope:** This task is part of Epic 2, which covers the complete user journey:

- Recording flow (manual start/stop)
- Analysis pipeline
- Replay visualization (Hawk-Eye + top-down)
- Export options (screenshot, video, JSON)

See the [full user flow diagram](https://github.com/vikraman2212/sports-analyst/issues/10) for details.

### Key Decision Points:

- ✅ **Hawk-Eye side view** (default) - familiar to cricket fans
- ✅ **Top-down wagon wheel view** - shows swing/line clearly
- ✅ **Single static frame** for context (~900KB)
- ✅ **Export as video** via canvas animation recording
- ❌ **No video buffering** (avoiding 83MB memory usage)

---

## 📊 Final Comparison

| Aspect                  | Trajectory-Only ✅   | Video Buffer ❌ |
| ----------------------- | -------------------- | --------------- |
| **Memory Usage**        | ~901KB               | ~83MB           |
| **Implementation Time** | 5 days               | 7 days          |
| **Device Support**      | All devices          | Mid-range+ only |
| **Crash Risk**          | 0%                   | Low-medium      |
| **Professional Look**   | Excellent (Hawk-Eye) | Good            |
| **Analysis Quality**    | Superior             | Good            |
| **Cricket-Specific**    | Yes (DRS/Hawk-Eye)   | Generic         |
| **Export Size**         | ~500KB video         | Large           |

---

## 📁 Deliverables

### 1. Core Components

- `lib/replay/trajectoryRenderer.ts` - Canvas rendering engine
- `lib/replay/types.ts` - ReplaySession, BufferedFrame types
- `components/TrajectoryReplay.tsx` - Replay UI component
- `hooks/useReplayPlayer.ts` - Playback state management

### 2. View Modes

- **Side View (Hawk-Eye)** - Default, side projection showing bounce and height
- **Top-Down (Wagon Wheel)** - Bird's eye view showing line and swing

### 3. Export Options

- **PNG Screenshot** - Static frame with trajectory overlay
- **WebM Video** - 3s animated replay (~500KB)
- **JSON Data** - Raw trajectory points and metadata

---

## 🎨 Visual Reference

**Interactive Mockup:** `docs/replay-trajectory-only-mockup.html`

- Open in browser to see live demonstrations
- Modern blue/purple color scheme (professional sports tech aesthetic)
- 4 different visualization styles showcased

**User Flow Diagram:** [GitHub Issue #10](https://github.com/vikraman2212/sports-analyst/issues/10)

- Complete Mermaid diagram showing recording → analysis → replay → export flow
- Decision points and error handling paths
- UI mockups for each state

---

## 🚀 Implementation Plan

### Phase 1: Core Rendering (2 days)

- [ ] TrajectoryRenderer class with side view
- [ ] Canvas-based playback using requestAnimationFrame
- [ ] Static frame capture at ball release

### Phase 2: UI Controls (1 day)

- [ ] TrajectoryReplay component
- [ ] Play/pause/seek controls
- [ ] useReplayPlayer hook

### Phase 3: Additional Views (1 day)

- [ ] Top-down view renderer
- [ ] View mode switcher
- [ ] Smooth transitions

### Phase 4: Export (1 day)

- [ ] PNG screenshot export
- [ ] WebM video generation via MediaRecorder
- [ ] JSON export (extend existing)

---

## ✅ Acceptance Criteria

### Replay Functionality

- [ ] Opens in Hawk-Eye side view by default
- [ ] Smooth 30fps animation
- [ ] Play/pause/seek controls work precisely
- [ ] View switcher toggles between side/top-down
- [ ] Annotations show speed, bounce point, length

### Performance

- [ ] Memory usage <5MB total
- [ ] Playback no dropped frames
- [ ] Export completes in <3 seconds

### User Experience

- [ ] Professional look (like TV broadcast)
- [ ] Clear metrics overlay
- [ ] Intuitive controls
- [ ] Works on all devices (tested on iPhone 12, Android mid-range)

---

## 💡 Rationale

### Why Trajectory-Only Wins:

1. **Zero Memory Risk**

   - 901KB vs 83MB = 99% reduction
   - No out-of-memory crashes on mobile
   - Works on devices with as little as 1GB RAM

2. **Cricket-Specific Excellence**

   - Hawk-Eye/DRS is the gold standard for cricket analysis
   - Users trust and understand this visualization
   - Better for coaching and analysis than raw video

3. **Technical Advantages**

   - Faster to implement (5 days vs 7)
   - Simpler codebase (no ring buffer complexity)
   - Easy to test (deterministic rendering)
   - Export is lightweight (~500KB vs large video files)

4. **Future-Proof**
   - Can add video buffer later as opt-in feature
   - Progressive enhancement approach
   - Start simple, add complexity only if needed

### Confidence Level: 85%

**High confidence in:**

- Implementation feasibility (reusing TrajectoryOverlay)
- Memory safety (simple math checks out)
- Professional appearance (mockup looks great)
- Cricket fan reception (familiar visual language)

**Medium confidence in:**

- Initial user reaction (need to educate on benefits)
- Export video quality (need to test MediaRecorder)
- iOS Safari canvas performance (known quirks)

---

## 🔗 References

- **Analysis Document:** `docs/trajectory-only-replay-analysis.md`
- **Interactive Mockup:** `docs/replay-trajectory-only-mockup.html`
- **User Flow Epic:** [GitHub Issue #10](https://github.com/vikraman2212/sports-analyst/issues/10)
- **Project Plan:** `docs/project-plan.json` (Task 5 updated)
- **Hawk-Eye Reference:** https://cdn.analyticsvidhya.com/wp-content/uploads/2020/03/hawk-eye-system.jpg

---

## 🎬 Next Steps

1. ✅ ~~Explore architecture options~~ (COMPLETE)
2. ✅ ~~Create visual mockup~~ (COMPLETE)
3. ✅ ~~Define user flow~~ (COMPLETE - GitHub Issue #10)
4. ✅ ~~Update project plan~~ (COMPLETE)
5. ⏳ Begin implementation (Phase 1: Core Rendering)

**Ready to start coding!** 🚀

---

**Approved by:** @vikraman2212  
**Date:** 27 October 2025  
**Implementation Start:** TBD (after Task 3: YOLOv8 migration)

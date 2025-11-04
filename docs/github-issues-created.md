# GitHub Issues Created - 2025-01-XX

Complete synchronization of project-plan.json tasks to GitHub issues.

## Summary

- **Total Issues Created:** 18 new issues (+2 on 2025-10-28)
- **Existing Issues:** 9 issues (already in GitHub)
- **Total Coverage:** All 18 tasks now have GitHub tracking

## New Issues Created

### Completed Tasks (Documentation Issues)

1. **#15: T1 - Configurable Pitch Length ✅**

   - Status: COMPLETED (2025-10-26)
   - 7 tests passing, production ready
   - Full implementation with localStorage persistence

2. **#16: T2 - Configurable Ball Weight ✅**

   - Status: COMPLETED (2025-10-26)
   - 18 tests passing, ICC-compliant physics
   - Integrated into drag calculations

3. **#17: T4 - Camera Diagnostics & Settings Panel ✅**

   - Status: COMPLETED (2025-10-26)
   - 31 tests passing, real-time monitoring
   - FPS inference, exposure detection, warnings

4. **#18: T5 - Ball Tracking Recording & Replay ✅**

   - Status: COMPLETED (2025-10-27)
   - 42 tests passing, Hawk-Eye visualization
   - Trajectory-only approach (~901KB memory)

5. **#19: T8 - Stabilize Tests & Build ✅**
   - Status: COMPLETED (2025-10-26)
   - 510 tests passing (437 → 510)
   - Clean production build

### Bug Issue

6. **#20: T11 - Bug: "New Delivery" Doesn't Reset Camera State 🐛**
   - Status: READY (High Priority)
   - User workflow bug
   - Estimated: 2 hours fix

### YOLOv8 Migration Tasks (Epic #4)

7. **#21: T3A - Survey Pretrained Cricket Ball Models 🔍**

   - Status: READY
   - Research task (2 days)
   - Roboflow, Ultralytics, GitHub sources

8. **#22: T3B - Benchmark Pretrained Models 📊**

   - Status: PLANNED
   - Depends on T3A
   - Performance testing (1 day)

9. **#23: T3C - Dataset Plan - Capture, Labeling & Augmentation 🏷️**

   - Status: PLANNED
   - Depends on T3B
   - 500+ images, small-object strategy (3 days)

10. **#24: T3D - Train YOLOv8/YOLO11 & Export ONNX 🧠**

    - Status: PLANNED
    - Depends on T3C
    - Model training, ONNX export (3 days)

11. **#25: T3E - Integrate Trained Model into App ⚡**
    - Status: PLANNED
    - Depends on T3D
    - App integration, validation (1 day)

### Player Stats Tasks (Epic #14)

12. **#26: T12 - Player Stats Backend API 🔌**

    - Status: PLANNED
    - FastAPI + PostgreSQL/SQLite
    - Device key auth (1 day)

13. **#27: T13 - Player Stats Offline Queue 📶**

    - Status: PLANNED
    - localStorage + Background Sync
    - Depends on T12 (0.75 days)

14. **#28: T14 - Player Stats Dashboard UI 📊**

    - Status: PLANNED
    - Recharts integration
    - Depends on T12 (1 day)

15. **#29: T15 - Player Stats Export & Privacy 🔒**

    - Status: PLANNED
    - CSV/JSON export, clear data
    - Depends on T13, T14 (0.5 days)

16. **#30: T16 - Camera Calibration UI & Settings Controls 🎯**
    - Status: COMPLETED (2025-10-28) ✅
    - Interactive calibration wizard with profile management
    - 43 new tests passing (588 total)
    - Note: Camera settings controls deferred to T17

### New Issues Created (2025-10-28)

17. **#31: T17 - Camera Settings Controls - FPS & Resolution Adjustment ⚙️**

    - Status: PLANNED (High Priority)
    - Wire existing CameraSettings component to UI
    - Enable FPS, resolution, exposure adjustment
    - Depends on T16
    - Estimated: 1 day (4-6 hours)

18. **#32: T18 - Fix Calibration Overlay UX 🐛**
    - Status: PLANNED (Medium Priority)
    - Fix overlay interference with pitch length selector
    - Improve z-index management and dismiss behavior
    - Depends on T16
    - Estimated: 0.5 days (2-3 hours)

## Existing Issues (Already in GitHub)

- **#1:** Epic 1 - Main Speedometer Enhancements
- **#4:** T3 - Migrate Detection to YOLOv8 (parent issue)
- **#7:** T6 - Docs & Tests
- **#8:** T7 - Mobile Testing via ngrok
- **#10:** Epic 2 - Recording & Replay User Flow
- **#11:** T9 - Smart Trim (completed)
- **#12:** Epic 3 - Future Enhancements (T10)
- **#13:** Duplicate Epic 4 (can be closed)
- **#14:** Epic 4 - Player Statistics (full)

## Project Plan Updates

All tasks in `docs/project-plan.json` now include GitHub references:

```json
{
  "github": {
    "issueNumber": XX,
    "url": "https://github.com/vikraman2212/sports-analyst/issues/XX"
  }
}
```

## Coverage Statistics

### By Status

- ✅ **Completed:** 7 tasks (T1, T2, T4, T5, T8, T9, T16)
- 🔴 **Ready:** 2 tasks (T3A, T11)
- 📋 **Planned:** 9 tasks (T3B-E, T6, T7, T10, T12-15, T17, T18)

### By Epic

- **Epic 1 (Main):** T1, T2, T4, T6, T8, T16 - 6 tasks
- **Epic 2 (Replay):** T5, T9, T11 - 3 tasks
- **Epic 3 (Future):** T10 - 1 task
- **Epic 4 (Player Stats):** T12-15 - 4 tasks
- **YOLOv8 Migration:** T3, T3A-E - 6 tasks

### By Owner

- **Frontend:** 11 tasks
- **Backend:** 1 task
- **ML:** 4 tasks
- **Fullstack:** 2 tasks

## Next Actions

1. **Immediate (High Priority):**
   - Fix T11 bug (2 hours) - camera reset issue
   - Start T16 (3 days) - camera calibration UI (critical usability gap)
2. **Short-term:** Start T3A (YOLOv8 research) on 2025-10-30
3. **Medium-term:** Plan Player Stats sprint after YOLOv8 migration
4. **Ongoing:** Update GitHub issues as tasks progress

## Issue Quality Standards

All issues include:

- ✅ Clear objective and description
- ✅ Comprehensive deliverables list
- ✅ Specific acceptance criteria
- ✅ Technical implementation details
- ✅ Code examples and pseudocode
- ✅ File references and structure
- ✅ Testing plan and coverage
- ✅ Dependencies and references
- ✅ Architecture compliance notes
- ✅ For completed tasks: full verification reports

## Total Effort Estimate

- **Completed:** 12 days (T1: 3d, T2: 1d, T4: 2d, T5: 1d, T8: 1d, T9: 1d, T11: 0.25d)
- **Remaining:** 21.75 days
  - Camera Calibration: 3 days (T16)
  - YOLOv8: 10 days (T3A-E)
  - Docs/Tests: 4 days (T6)
  - Mobile: 1 day (T7)
  - Auto-Stop: 2 days (T10)
  - Player Stats: 3 days (T12-15)

**Total Project:** ~33.75 days

---

**Generated:** 2025-01-XX  
**Tool:** GitHub Copilot (mcp_github_issue_write)  
**Repository:** vikraman2212/sports-analyst

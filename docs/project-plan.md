# Speedometer – Project Plan (JSON + Gantt)

This document includes a canonical JSON plan and a visual Gantt chart for the cricket ball tracking enhancements.

## JSON Plan

See `docs/project-plan.json` for the machine-readable plan used to drive tasks, timelines, dependencies, and risks.

## Gantt (Mermaid)

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title Speedometer – Cricket Ball Tracking Enhancements
    excludes weekends

    section Configuration
    Configurable Pitch Length (T1)     :done, t1, 2025-10-27, 3d
    Configurable Ball Weight (T2)      :done, t2, 2025-10-27, 1d
    Mobile Testing via ngrok (T7)      :t7, 2025-10-27, 1d

    section Detection
    Migrate to YOLOv8 (T3)             :t3, 2025-10-30, 10d

    section Camera
    Camera Settings Guidance (T4)      :t4, after t1, 6d

    section Replay
    Ball Tracking Replay (T5)          :t5, after t3, 7d

    section Hardening
    Stabilize Failing Tests (T8)       :done, t8, 2025-10-26, 1d
    Docs & Tests (T6)                  :t6, after t1 t2 t3 t4 t5, 4d
```

## Notes

- Start date: 2025-10-27. Target completion: 2025-11-21.
- T1 and T2 can run in parallel. T4 begins after T1. T5 depends on T3. T6 depends on all prior tasks.
- See JSON for acceptance criteria, deliverables, and likely touchpoints in the codebase.

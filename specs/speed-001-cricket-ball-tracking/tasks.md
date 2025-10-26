# Tasks: Cricket Ball Tracking System

- [x] T016 Implement speed calculation module `python/speedometer/speed_calc.py`, `frontend/src/lib/speed-calculation/speed.ts`
- [x] T017 Implement detection interfaces + adapter `frontend/src/lib/detection/types.ts`, `frontend/src/lib/detection/adapter.ts`, `frontend/src/lib/detection/mockDetector.ts`
- [x] T018 Implement `analyzeDelivery` orchestration `frontend/src/lib/analyzeDelivery.ts`
- [x] T019 Implement frame sampling helper `frontend/src/lib/detection/frameSampler.ts`
- [x] T020 Implement trajectory smoothing `frontend/src/lib/speed-calculation/trajectorySmoothing.ts`**: Design documents from `/specs/speed-001-cricket-ball-tracking/`
      **Prerequisites\*\*: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)

(Reference: Generated per tasks prompt requirements)

## Phase 3.1: Setup

- [x] T001 Create `frontend/` Next.js scaffold (`npx create-next-app@latest` with TypeScript, ESLint)
- [x] T002 Add directories: `frontend/src/lib/{detection,speed-calculation,calibration}`, `frontend/src/hooks`, `frontend/src/components`
- [x] T003 [P] Configure formatting & linting: add Prettier + ESLint rules (performance focus)
- [x] T004 Add `ml/` scaffolding: `ml/training/`, `ml/notebooks/`, placeholder `export/README.md` (gitignore dataset)
- [x] T005 Initialize Python environment (uv/venv) with fastai, torch, opencv-python, onnx, onnxruntime (training side)
- [x] T006 [P] Add root `python/tests/` structure and `pytest` config for speed calc tests
- [x] T007 Set up basic Git attributes & `.gitignore` entries (model files, dataset, notebooks checkpoints)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

(Write tests; they must fail initially)

- [x] T008 [P] Contract test local inference interface shape in `frontend/src/tests/contract/localInference.contract.test.ts`
- [x] T009 [P] Contract test analysis session OpenAPI placeholder (ensure file loads & expected paths) `frontend/src/tests/contract/analysisSession.contract.test.ts`
- [x] T010 [P] Python speed calculation unit test (synthetic positions → expected km/h) `python/tests/test_speed_calc.py`
- [x] T011 [P] Detection pipeline stub test (expects normalized detection objects) `frontend/src/tests/integration/detectionPipeline.int.test.ts`
- [x] T012 [P] Integration test: successful delivery flow (capture → analyze → speed displayed) `frontend/src/tests/integration/deliveryFlow.int.test.ts`
- [x] T013 [P] Integration test: insufficient detections path `frontend/src/tests/integration/insufficientDetections.int.test.ts`
- [x] T014 [P] Integration test: calibration required message `frontend/src/tests/integration/calibrationRequired.int.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T015** Implement calibration module (`frontend/src/lib/calibration/`)

  - [x] Create validation utilities (`isValidCalibration()`)
  - [x] Add pixel-to-meter conversion functions
  - [x] Define cricket pitch constants (22 yards = 20.12m)

- [x] **T016** Implement speed calculation module
  - [x] Python: `python/speedometer/speed_calc.py`
  - [x] TypeScript wrapper in `frontend/src/lib/speed-calculation/`
- [x] T017 [P] Implement detection interfaces + adapter `frontend/src/lib/detection/types.ts` & `frontend/src/lib/detection/adapter.ts`
- [x] T018 Implement `analyzeDelivery` orchestration `frontend/src/lib/analyzeDelivery.ts`
- [x] T019 Implement frame sampling helper `frontend/src/lib/detection/frameSampler.ts`
- [x] T020 Implement trajectory smoothing `frontend/src/lib/speed-calculation/trajectorySmoothing.ts`
- [x] T021 Add ROI cropping logic `frontend/src/lib/detection/roiManager.ts`
- [x] T022 Implement React hook `useCameraFeed` `frontend/src/hooks/useCameraFeed.ts`
- [x] T023 Implement React hook `useInference` `frontend/src/hooks/useInference.ts`
- [x] T024 Component `CameraView` `frontend/src/components/CameraView.tsx`
- [x] T025 Component `SpeedDisplay` `frontend/src/components/SpeedDisplay.tsx`
- [x] T026 Component `TrajectoryOverlay` `frontend/src/components/TrajectoryOverlay.tsx`
- [x] T027 Page integration & layout `frontend/src/app/page.tsx`
- [x] T028 JSON export utility (deferred if time) `frontend/src/lib/export/jsonExport.ts` (create placeholder if not implemented)

## Phase 3.4: Integration

- [x] T029 Wire detection adapter to ONNX Runtime (load model from `/public/model.onnx`) `frontend/src/lib/detection/onnxRuntime.ts`
- [x] T030 Add fallback mock detector for development `frontend/src/lib/detection/mockDetector.ts`
- [x] T031 Performance timing instrumentation (processingMs) `frontend/src/lib/metrics/timing.ts`
- [x] T032 Add warning generation (insufficient detections, low confidence) `frontend/src/lib/speed-calculation/warnings.ts`
- [ ] T033 Error boundary & graceful failure UI `frontend/src/components/ErrorBoundary.tsx`
- [x] T034 Logging/debug utilities (optional console wrappers) `frontend/src/lib/debug/log.ts`

## Phase 3.5: Polish

- [x] T035 [P] Unit tests trajectory smoothing `frontend/src/tests/unit/trajectorySmoothing.unit.test.ts`
- [x] T036 [P] Unit tests ROI manager `frontend/src/tests/unit/roiManager.unit.test.ts`
- [x] T037 [P] Performance test harness measuring latency `frontend/src/tests/perf/performance.test.ts`
- [x] T038 Accessibility pass (ARIA roles, labels) `frontend/src/components/*`
- [x] T039 Responsive layout refinements (mobile vs desktop) `frontend/src/styles/responsive.css`
- [x] T040 Documentation update: extend quickstart with calibration guidance `specs/speed-001-cricket-ball-tracking/quickstart.md`
- [x] T041 Add JSON export UI toggle (if implemented) `frontend/src/components/ExportButton.tsx`
- [x] T042 Manual test script `docs/manual-testing.md` (create new) summarizing flows
- [x] T043 Final constitution alignment review (speed accuracy / detection placeholders) `specs/speed-001-cricket-ball-tracking/plan.md`

## Dependencies

- Setup (T001-T007) precedes tests.
- All test tasks (T008-T014) must exist & fail before any implementation tasks (T015+).
- Calibration (T015) & speed calc (T016) precede analyzeDelivery (T018).
- Detection adapters (T017, T019, T021) precede analyzeDelivery (T018).
- analyzeDelivery (T018) precedes hooks (T023) & overlay components (T026).
- Hooks (T022-T023) precede page integration (T027).
- ONNX runtime integration (T029) depends on detection adapter (T017) & analyzeDelivery (T018).
- Performance & warning instrumentation (T031-T032) depend on core modules (T015-T020, T018).

## Parallel Execution Examples

```
# Example: Run initial contract & integration tests in parallel once setup done
T008 T009 T010 T011 T012 T013 T014

# Example: After tests written & failing, start core modules in parallel
T015 T016 T017 (then T018 once those pass tests) and in parallel T019 T021

# Example: Polish unit tests concurrently
T035 T036 T037
```

## Notes

- [P] tasks chosen where files are independent; ensure no shared file edits simultaneously.
- Keep failing tests committed before implementing corresponding logic.
- Defer JSON export utility if timeline tight—retain placeholder to satisfy architecture.

## Validation Checklist

- [ ] All contract files have test coverage (local inference + OpenAPI stub)
- [ ] All entities surfaced via at least one test path (speed calc uses Delivery & TrajectoryPoints conceptually)
- [ ] Tests precede implementation modules
- [ ] Parallel tasks only touch distinct files
- [ ] Page integrates hooks & components after underlying logic exists
- [ ] Performance instrumentation present before polish perf tests

---

/**
 * Speed calculation module for cricket ball tracking
 */

export { calculateSpeed, calculateAverageSpeed } from './speed';
export {
  smoothTrajectory,
  validateSmoothedTrajectory,
  getRecommendedSmoothingConfig,
  DEFAULT_SMOOTHING_CONFIG,
  type SmoothingConfig,
  type SmoothedTrajectoryPoint,
} from './trajectorySmoothing';

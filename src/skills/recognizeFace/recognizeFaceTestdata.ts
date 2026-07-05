/**
 * Euclidean distance threshold between two face-api descriptors. 0.6 is the
 * value face-api/dlib recommend for this specific model (calibrated on LFW):
 * pairs of photos of the same person are almost always below it, different
 * people almost always above it.
 */
export const FACE_MATCH_THRESHOLD = 0.55;

/**
 * Below this confidence (derived from how close the distance is to the
 * threshold) a match is reported as "uncertain" instead of a plain match,
 * even though it's technically inside the threshold.
 */
export const MIN_FACE_CONFIDENCE = 0.35;

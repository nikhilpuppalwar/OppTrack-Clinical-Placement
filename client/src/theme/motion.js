/**
 * ==============================================================================
 * 🎬 OppTrack Motion & Interaction Design System
 * ==============================================================================
 * Central JavaScript motion tokens mirroring client/src/theme/motion.css
 *
 * Guidelines:
 * - 100–180 ms for micro-interactions & tactile button presses
 * - 120–220 ms for button & card hover transitions
 * - 160–240 ms for small overlays & dropdowns
 * - 200–350 ms for content & screen entrances
 * - 250–400 ms for larger transitions & modal sheets
 *
 * All motion is designed to feel native, restrained, intentional, and snappy.
 * ==============================================================================
 */

export const MOTION_DURATIONS = {
  instant: 100,     // Instant feedback (icon changes, checkbox toggle, active press)
  micro: 140,       // Micro transitions (tooltip show, badge highlight, focus outline)
  fast: 180,        // Standard hover & interactives (buttons, inputs, row hover)
  overlay: 220,     // Popovers, dropdown menus, quick search command palette
  content: 280,     // Tab pane switches, accordions, card reveals
  page: 320,        // Screen transitions, modal cards, side drawer sliding
  deliberate: 380,  // Full-screen flows, complex orchestrated charts
};

export const MOTION_EASINGS = {
  // Apple / Linear standard: smooth deceleration into place
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  // Snappy entrance: fast acceleration out of origin, soft settle
  entrance: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  // Exiting elements: accelerates away cleanly without lingering
  exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  // Restrained tactile micro-spring for clicks and button rebounds (no excessive oscillation)
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  // Smooth symmetrical ease for linear state changes
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const MOTION_DISTANCES = {
  micro: '1px',      // Button hover lift: translateY(-1px)
  sm: '2px',         // Card hover elevation: translateY(-2px)
  md: '6px',         // Dropdown menu entrance: translateY(-6px)
  entrance: '10px',  // Content and screen entrance gentle rise
  lg: '16px',        // Drawer and overlay slide
};

export const MOTION_STAGGER = {
  step: 40,          // 40ms stagger increment between items
  maxDelay: 200,     // Cap at 200ms so users never wait on content
};

export const THEME_MOTION = {
  durations: MOTION_DURATIONS,
  easings: MOTION_EASINGS,
  distances: MOTION_DISTANCES,
  stagger: MOTION_STAGGER,
};

export default THEME_MOTION;

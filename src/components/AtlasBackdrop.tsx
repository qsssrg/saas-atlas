/**
 * Site-wide cartographic backdrop: faint flowing contour lines + a subtle
 * survey grid, fixed behind every page. Pure SVG/CSS, no client JS, no images.
 *
 * The lines echo the home hero's "surveyor's map" language but are tuned much
 * fainter (see .atlas-backdrop in globals.css) so text and tables sitting on
 * solid cards stay fully readable. Positioned at z-index:-1 with the paper
 * base moved to <html>, so content always paints above it.
 *
 * viewBox is taller than the hero's (0 0 1200 900) so the lines are spread
 * across the whole viewport height rather than clustered near the fold.
 */
export default function AtlasBackdrop() {
  return (
    <div className="atlas-backdrop" aria-hidden="true">
      <svg
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M-40 120 C180 80 300 170 480 130 S760 40 940 90 1160 130 1260 100" />
        <path d="M-40 240 C200 200 340 285 520 240 S800 150 980 200 1180 235 1260 210" />
        <path d="M-40 360 C160 320 240 415 420 370 S740 275 900 320 1140 365 1260 335" />
        <path d="M-40 480 C220 440 380 520 560 475 S840 390 1020 430 1200 470 1260 450" />
        <path d="M-40 600 C180 560 320 640 500 600 S780 510 960 555 1160 595 1260 575" />
        <path d="M-40 720 C200 685 360 760 540 720 S820 635 1000 675 1190 715 1260 700" />
        <path d="M-40 830 C160 800 260 865 440 830 S760 745 940 785 1150 825 1260 810" />
      </svg>
    </div>
  );
}

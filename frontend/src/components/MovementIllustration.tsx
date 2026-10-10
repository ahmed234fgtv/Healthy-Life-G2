/** Original decorative drawing: an open track, with one point marking an activity. */
export default function MovementIllustration() {
  return (
    <div className="movement-illustration" aria-hidden="true">
      <svg viewBox="0 0 380 220" fill="none">
        <path d="M-40 177H206a65 65 0 0 0 0-130h-33a43 43 0 0 0 0 86h238" />
        <path d="M-40 190H206a78 78 0 0 0 0-156h-33a56 56 0 0 0 0 112h238" />
        <path d="M-40 203H206a91 91 0 0 0 0-182h-33a69 69 0 0 0 0 138h238" />
        <path d="M-40 216H206a104 104 0 0 0 0-208h-33a82 82 0 0 0 0 164h238" />
        <path className="track-accent" d="M28 177H108" />
        <circle className="track-point" cx="108" cy="177" r="7" />
        <path className="track-tick" d="M108 160v-39" />
        <text x="98" y="111">
          01
        </text>
      </svg>
      <span>
        ACTIVIDAD FÍSICA <span>—</span> REGISTRO PERSONAL
      </span>
    </div>
  )
}

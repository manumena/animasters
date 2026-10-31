# Between-round countdown alternatives — October 31, 2026

Editable source: `source.html`. Browser-openable preview: `preview.html`.

- **Large timer:** 64px digits inside the reveal card, alongside Ready. Smallest layout change; the timer can still sit below the fold on smaller screens.
- **Top banner:** a dedicated countdown above the result and song reveal, with 56px digits and Ready beside the timing information. Recommended for visibility, especially on phones.
- **Countdown ring:** 48px digits in a 132px ring inside the reveal card. The draining arc communicates remaining time without relying solely on a number; uses more vertical space on phones.

All options show mint normally, warm amber plus “Get ready to listen” at three seconds, and a static starting state at zero. Amber is distinct from wrong-answer feedback. No flashing or repeated pulsing. Keep the explicit seconds and label so color is supplementary. Retain Ready and Enter/Space hints. In production, read the same authoritative server deadline; Ready can shorten the interval when everyone connected is ready. These sketches simulate timing locally and do not change gameplay or production files.

Use Play to run a ten-second example, or Show final 3 seconds for a static comparison. Ready changes the illustrative count from two to three of four players; it does not simulate everyone becoming ready. Controls below the game are preview-only. The optional design panel can adjust seconds remaining. Reduced motion disables the animated café backdrop. Sample scores and song metadata are illustrative. The pinned café image uses jsDelivr; the rest works offline.

Feedback: owner loved **Countdown ring** and requested continuous movement instead of discrete steps. The follow-up is retained in `../2026-10-31-continuous-countdown-ring/`; this original comparison remains unchanged.

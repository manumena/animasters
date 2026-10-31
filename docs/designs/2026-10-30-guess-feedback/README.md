# Guess feedback alternatives — October 30, 2026

Editable source: `source.html`. Browser preview: `preview.html` (sandboxed iframe and CSP). Production app unchanged by this exploration.

- **Result banner:** a prominent standalone outcome above the song reveal. Keeps the current reveal structure, with a large point change.
- **Answer card transformation:** turns the answer area into a result, comparing the submitted anime with the correct anime. Recommended for a direct connection between the guess and outcome.
- **Brief celebration:** emphasizes the outcome and points with a one-shot entrance animation on Replay reveal or a result change. The outcome remains visible afterward. Reduced-motion preferences suppress the animation.

Every variant supports Correct, Wrong and Passed examples, local next-song readiness and Replay reveal. Sample player scores and song metadata are illustrative. The timer is held at eight seconds for comparison; no backend, audio or network APIs are invoked. The café image is loaded from the same pinned CDN asset as previous sketches.

Feedback appears at the shared reveal, never while other players are still guessing. Each state includes text and an icon, so color is not the only cue. The existing music icon substitutes for artwork.

Owner selected **Result banner**, now implemented above the song reveal. The server groups passes and unanswered rounds together, so the neutral banner accurately says “Pass / no answer.” Correctness, points and display timing come from the revealed server result. Earlier match and lobby sketches are retained.

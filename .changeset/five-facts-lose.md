---
"hextimator": minor
---

Widens the default POSITIVE_RANGE to be [120, 180].

The previous range was to limiting so you could get an accent color that is green, and a positive color that is a whole other green that doesn't match.

Technically it changes the algorithm so it's a breaking change, but it's a minor change that should improve the color generation algorithm.

If you find your themes look worse, limit your positive range to the previous [120, 160].

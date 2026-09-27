---
title: Chapter 7 - Competitive Programmer's Handbook
author: Antti Laaksonen
date: 2026-09-16
status: finished
description: Dynamic programming - counting tilings.
---

Consider there are n rows and each row has m characters, and we have 1\*2, 2\*1 sized blocks.

Direct formula for calcuating the number of tilings:

$$
\prod_{a=1}^{\lceil n/2\rceil}
\prod_{b=1}^{\lceil m/2\rceil}
4\left(
\cos^2\frac{\pi a}{n+1}
+
\cos^2\frac{\pi b}{m+1}
\right)
$$

---
title: Deep Learning — Foundations
author: Goodfellow, Bengio, Courville
date: 2026-04-02
status: reading
description: Working notes on optimization, regularization, and why depth helps at all.
---

## Chapters 1-5: the setup

Learning is optimization under a capacity constraint. Everything else is
bookkeeping about how the constraint is enforced.

| Idea | One-line intuition |
| --- | --- |
| Bias-variance | Too rigid vs. too eager |
| Regularization | Pay for complexity you didn't earn |
| SGD | Noisy gradients are a feature, not a bug |

## Chapter 7: regularization

- Weight decay pulls parameters toward a prior of "small".
- Dropout as an ensemble over sub-networks was the idea that finally stuck.
- Early stopping is regularization with a validation set as the referee.

```python
for batch in loader:
    loss = criterion(model(batch.x), batch.y)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
```

## Open questions

Why does depth generalize better than width at equal parameter count? The book
gestures at compositional structure in data; I want a sharper answer.

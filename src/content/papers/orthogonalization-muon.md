---
title: 'Muon: An optimizer for hidden layers in neural networks'
authors: Keller Jordan
year: 2024
link: 'https://kellerjordan.github.io/posts/muon/'
pdf_url: 'https://arxiv.org/pdf/2406.19108.pdf'
tags:
  - optimization
  - training
pdf: /papers/orthogonalization-muon.pdf
---

## Takeaways

- Orthogonalizes matrix updates (spectral flattening) rather than per-coordinate scaling.
- Appears to help when update matrices are very ill-conditioned / nearly low-rank.

## Questions

- When does orthogonalization hurt?
- How sensitive is it to the Newton–Schulz step count / precision?

---
title: "VIME: Variational Information Maximizing Exploration"
authors: "Rein Houthooft, Xi Chen, Yan Duan, John Schulman, Filip De Turck, Pieter Abbeel"
year: 2016
link: "https://arxiv.org/abs/1605.09674"
pdf_url: "https://arxiv.org/pdf/1605.09674.pdf"
tags: ["reinforcement-learning", "exploration", "variational-inference", "to-read"]
date: 2026-05-25
---

## Why it is here

VIME is a clean example of exploration as information gain about dynamics, not just action noise.

## Reading angle

- Treat curiosity as posterior change in a learned dynamics model.
- Compare with count-based exploration, entropy bonuses, and modern intrinsic reward methods.
- Useful for thinking about sparse-reward games without hand-coded tactical hints.

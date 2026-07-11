---
title: >-
  Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with
  a Stochastic Actor
authors: 'Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, Sergey Levine'
year: 2018
link: 'https://arxiv.org/abs/1801.01290'
pdf_url: 'https://arxiv.org/pdf/1801.01290.pdf'
tags:
  - reinforcement-learning
  - maximum-entropy
  - actor-critic
  - to-read
date: 2026-05-25T00:00:00.000Z
thumbnail: /papers/_thumbs/soft-actor-critic-w360.webp
pdf: /papers/soft-actor-critic.pdf
---

## Why it is here

SAC is a practical cornerstone for maximum-entropy RL. It belongs next to the probabilistic-inference framing because it turns entropy regularization into a stable off-policy actor-critic algorithm.

## Reading angle

- Focus on why off-policy replay and entropy regularization fit together.
- Compare the critic target to standard Bellman backups.
- Useful as a concrete implementation target after PPO-style experiments.

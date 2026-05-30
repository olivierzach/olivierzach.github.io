---
title: "Maximum Likelihood Reinforcement Learning"
authors: "Yiding Jiang, Fahim Tajwar, Guanning Zeng, Yueer Zhou, Yuda Song, Daman Arora, Jeff Schneider, Ruslan Salakhutdinov, Haiwen Feng, Andrea Zanette"
year: 2026
link: "https://arxiv.org/abs/2602.02710v1"
pdf_url: "https://arxiv.org/pdf/2602.02710v1.pdf"
tags: ["reinforcement-learning", "maximum-likelihood", "sampling", "to-read"]
date: 2026-05-25
---

## Why it is here

This is the MaxRL paper from the recent Zotero batch. It directly targets the question of whether ordinary RL objectives are actually maximizing the likelihood of correct sampled rollouts.

## Reading angle

- Treat binary outcome feedback as inducing a likelihood over successful rollouts.
- Compare MaxRL's compute-indexed objectives with standard policy-gradient approximations.
- Useful for thinking about code generation, math solving, and sparse-reward sampling problems where the goal is not just higher reward but more probability mass on correct trajectories.

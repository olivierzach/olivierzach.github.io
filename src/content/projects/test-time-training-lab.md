---
title: "Test-time training lab"
summary: "A compact PyTorch lab for fast-weight and test-time-training ideas, with toy equivalence demos and a small language-model training harness."
status: active
tags: ["deep-learning", "test-time-training", "fast-weights", "language-modeling"]
repo: "olivierzach/test-time-training-lab"
github: "https://github.com/olivierzach/test-time-training-lab"
thumbnail: "/projects/extracted/test-time-training-lab.svg"
date: 2026-05-25
---

## What it is

A learning repo for making test-time training concrete: minimal PyTorch modules, fast-weight update demos, and a small training harness that compares a local-window Transformer baseline with a chunk-updated fast-weight memory module.

## Why it matters

The repo keeps the core mechanism visible: some linear attention and recurrent updates can be read as one-step gradient updates on an online objective. That makes it a useful sandbox for testing optimizer choices, chunk sizes, local-memory tradeoffs, and retrieval-style evaluations.

[GitHub](https://github.com/olivierzach/test-time-training-lab)

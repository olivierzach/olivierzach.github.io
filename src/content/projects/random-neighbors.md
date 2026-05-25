---
title: "Random Neighbors"
summary: "Random-forest-style feature bagging for high-dimensional clustering experiments."
status: active
tags: ["clustering", "unsupervised-learning", "high-dimensional-data"]
repo: "olivierzach/random-neighbors"
github: "https://github.com/olivierzach/random-neighbors"
thumbnail: "/projects/extracted/random-neighbors.png"
date: 2026-05-16
---

## What it is
Random Neighbors is a small research repo for clustering when the useful feature subset is not obvious.

The core estimator repeatedly samples rows and features, fits a clustering kernel, and keeps the feature subsets that produce stable separation. The repo also includes an unsupervised random-forest proximity baseline for comparison.

[GitHub](https://github.com/olivierzach/random-neighbors)

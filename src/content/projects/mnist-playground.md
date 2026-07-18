---
title: "MNIST Playground"
summary: "An interactive in-browser MNIST lab with ONNX Runtime inference, drawing, preprocessing traces, feature heatmaps, and linked embedding/logit spaces."
status: active
tags: ["computer-vision", "deep-learning", "interpretability", "svelte"]
repo: "olivierzach/cv-playground"
github: "https://github.com/olivierzach/cv-playground"
demo: "https://olivierzach.github.io/cv-playground/"
date: 2026-06-04
---

## What it is

A static SvelteKit lab for exploring MNIST classifiers directly in the browser. It packages trained PyTorch models as ONNX artifacts, then lets users draw digits, inspect normalized tensors, compare probabilities/logits, and see how convolutional layers respond through feature heatmaps.

## Why it matters

The app turns a small CNN into a visible system: model variants, training perturbations, UMAP-style embeddings, logit space, confusion analysis, and validation proof are all shipped as static artifacts. The free-draw robust model is trained against hard cases like mirrored `3`s and `7`s, rotated digits, and upside-down-ish `1`s while preserving normal MNIST accuracy.

[Demo](https://olivierzach.github.io/cv-playground/) · [GitHub](https://github.com/olivierzach/cv-playground)

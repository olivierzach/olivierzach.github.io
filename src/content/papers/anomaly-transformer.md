---
title: >-
  Anomaly Transformer: Time Series Anomaly Detection with Association
  Discrepancy
authors: 'Jiehui Xu, Haixu Wu, Jianmin Wang, Mingsheng Long'
year: 2022
link: 'https://arxiv.org/abs/2110.02642'
pdf_url: 'https://arxiv.org/pdf/2110.02642.pdf'
tags:
  - time-series
  - anomaly-detection
  - transformers
  - annotated
  - read
date: 2026-05-29T00:00:00.000Z
thumbnail: /papers/_thumbs/anomaly-transformer-w360.webp
pdf: /papers/anomaly-transformer.pdf
---

## Why it is here

This is the latest heavily annotated Zotero paper in the library. The useful move is to treat attention as a measurable temporal association distribution rather than just a feature mixer.

## Reading angle

- Association discrepancy is the core object: compare learned series associations against a local temporal prior.
- The minimax training objective is doing criterion design, not just representation learning.
- Useful for telemetry work where anomalies are relational breaks rather than isolated point errors.

## Annotation trail

The annotations mostly track how the paper builds from reconstruction-based anomaly detection toward a two-branch attention mechanism, then sharpens the normal/abnormal gap with a minimax discrepancy objective.

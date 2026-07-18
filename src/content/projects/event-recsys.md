---
title: "Event recommender system"
summary: "A recommender-system project around event affinity, user behavior signals, and retrieval-ready recommendations."
status: paused
tags: ["recommender-systems", "events", "applied-ml"]
repo: "olivierzach/event-recsys"
github: "https://github.com/olivierzach/event-recsys"
date: 2022-11-29
---

## What it is
An event-affinity recommender built from user-product interaction histories. The core script pivots long event logs into a user-by-event engagement matrix, inspects event-to-event Pearson correlation, then trains a small embedding model where users and events share a dot-product scoring space.

[GitHub](https://github.com/olivierzach/event-recsys)

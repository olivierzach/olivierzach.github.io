---
title: "Complexity-aware program evolution"
summary: "Program evolution experiments that track fitness, complexity, and the tradeoff between improvement and bloat."
status: active
tags: ["program-synthesis", "evolution", "complexity"]
repo: "olivierzach/complexity-aware-program-evolution"
github: "https://github.com/olivierzach/complexity-aware-program-evolution"
date: 2026-03-27
---

## What it is
A research scaffold for evolutionary program repair and search. Candidate patches mutate, run through a sandboxed test harness, and are selected by test success plus complexity proxies such as diff size, gzip bytes, edit distance, or static-code complexity.

[GitHub](https://github.com/olivierzach/complexity-aware-program-evolution)

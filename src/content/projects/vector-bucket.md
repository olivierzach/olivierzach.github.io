---
title: "Vector Bucket"
summary: "An audio discovery system combining MERT similarity, CLAP semantic search, and interactive embedding maps over a personal music library."
status: "active"
tags: ["audio", "embeddings", "retrieval", "visualization"]
date: "2026-09-05"
---

## What it is

An audio embedding atlas for exploring music by sound. MERT provides music similarity, CLAP connects natural-language queries to audio, and an interactive map supports browsing tracks, albums, and clips.

## What is implemented

The local pipeline includes library scanning, audio feature extraction, GPU embedding jobs, nearest-neighbor retrieval, and a FastAPI-backed web interface. Full-library MERT and CLAP artifacts cover 4,125 tracks; the MERT library spans 848 albums.

The map offers a PCA structure view and a UMAP neighborhood view. Changing the visualization does not change the underlying recommendation scores.

## Research connection

[MERT](https://arxiv.org/abs/2306.00107) connects the representation-learning literature to a working audio retrieval system. The next evaluation question is how well embedding neighbors match listening judgments across tracks and shorter clips.

This is a local project with a personal audio library.

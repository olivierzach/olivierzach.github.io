---
title: "YouTube embedding pipeline"
summary: "A local-first pipeline for audio download, Whisper transcription, text embeddings, and audio embeddings."
status: active
tags: ["embeddings", "audio", "retrieval"]
repo: "olivierzach/youtube-embed-pipeline"
github: "https://github.com/olivierzach/youtube-embed-pipeline"
thumbnail: "/projects/extracted/youtube-embed-pipeline.svg"
date: 2026-03-28
---

## What it is
A local YouTube-to-embedding pipeline with two paths: talks become Whisper transcripts plus text embeddings, and music becomes sampled audio chunks plus AST-style audio fingerprints.

Outputs are written to Parquet with run metadata so later search and retrieval work has something durable to build on.

[GitHub](https://github.com/olivierzach/youtube-embed-pipeline)

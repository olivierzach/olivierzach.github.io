---
title: "Local LLM stack"
summary: "A self-hosted vLLM, LiteLLM, Open WebUI, monitoring, and fine-tuning lab stack for an NVIDIA Spark host."
status: active
tags: ["llm", "local-first", "inference", "observability", "fine-tuning"]
repo: "olivierzach/local-llm-stack"
github: "https://github.com/olivierzach/local-llm-stack"
date: 2026-07-11
---

## What it is
A reproducible local assistant stack for running OpenAI-compatible model endpoints on a private NVIDIA Spark host. It wires vLLM backends through LiteLLM, exposes Open WebUI, and includes Prometheus/Grafana monitoring plus a small LoRA/QLoRA-oriented fine-tuning lab.

## Why it matters
The project turns local inference into an inspectable systems surface: model aliases, routing, health checks, request tracing, load tests, throughput evals, vision-serving experiments, and deployment runbooks live beside the compose stack.

[GitHub](https://github.com/olivierzach/local-llm-stack)

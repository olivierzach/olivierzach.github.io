---
title: "Conformal Lab"
summary: "Conformal prediction experiments comparing coverage, interval width, prediction sets, and calibration through an interactive research UI."
status: "active"
tags: ["uncertainty", "conformal", "evaluation", "visualization"]
date: "2026-09-05"
---

## What it is

A Python experiment lab with a React interface for exploring uncertainty across regression, classification, and time series. The interface reads saved experiment artifacts so model fitting and visual analysis remain reproducible.

## What is implemented

Regression experiments compare split and normalized conformal intervals with Gaussian-residual and bootstrap baselines. Classification experiments compare calibrated prediction sets and adaptive prediction sets with raw probability baselines.

Saved runs include predictions, coverage and subgroup metrics, interval or set sizes, calibration diagnostics, and experiment configuration. Sample scenarios combine real benchmark datasets with synthetic stress tests.

## Reading angle

The useful comparison is coverage together with interval width or set size, under the assumptions each method requires. Distribution shift and subgroup behavior make those assumptions visible.

This is a local research project; the interactive app runs from saved artifacts.

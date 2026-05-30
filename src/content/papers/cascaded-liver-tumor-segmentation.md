---
title: 'Automatic Liver and Tumor Segmentation of CT and MRI Volumes Using Cascaded Fully Convolutional Neural Networks'
authors: 'Patrick Ferdinand Christ, Florian Ettlinger, Sunil Tatavarty, Marc Bickel, Patrick Bilic, Markus Rempfler, Felix Hofmann, Seyed-Ahmad Ahmadi, Felix Grun, Mohamed Ezzeldin A. Elshaera, Jana Lipkova, Sebastian Schlecht, Freba Ahmaddy, Melvin D. Anastasi, Georgios Kaissis, Julian Holch, Wieland Sommer, Rickmer Braren, Volker Heinemann, Bjoern Menze'
year: 2017
link: 'http://arxiv.org/abs/1702.05970'
pdf_url: 'https://arxiv.org/pdf/1702.05970.pdf'
tags:
  - vision
  - segmentation
  - medical-imaging
  - cascaded-roi
date: 2026-05-30
thumbnail: /papers/_thumbs/cascaded-liver-tumor-segmentation-w360.webp
---

## Why it is here

This is one of the cascading ROI examples: use one model stage to narrow the target volume, then solve a harder segmentation problem locally.

## Reading angle

- Treat the cascade as an engineering prior, not only a network design.
- Compare coarse organ localization against fine lesion segmentation.
- Watch error propagation across stages.

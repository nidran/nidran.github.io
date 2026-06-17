---
layout: post
title: "Prompt Injection Detection: Teacher–Student Distillation"
date: 2026-02-01 09:00:00 +00:00
modified: 2026-02-01 09:00:00 +00:00
description: Knowledge distillation pipeline for fast, accurate prompt-injection detection.
tag:
  - llm
  - distillation
  - qlora
  - safety
---
* Developed a knowledge-distillation pipeline: fine-tuned Qwen2.5-3B with QLoRA (0.91 F1) and transferred soft-label distributions to a DistilBERT classifier (0.89 F1) at 134× lower latency.
* Designed a cascade architecture routing uncertain inputs to the teacher model, matching teacher F1 at ~9 ms average inference.

<p><a href="https://medium.com/@nidran" target="_blank" rel="noopener">Read the write-up on Medium →</a></p>

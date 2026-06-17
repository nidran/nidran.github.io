---
layout: post
title: "Audio-Language Reasoning Agent"
date: 2025-10-01 09:00:00 +00:00
modified: 2025-10-01 09:00:00 +00:00
description: A multimodal retrieve-then-reason pipeline for zero-shot audio classification.
tag:
  - multimodal
  - audio
  - rag
  - llm
---
* Engineered a multimodal retrieve-then-reason pipeline projecting audio and text into a shared CLAP embedding space with FAISS vector search.
* Routed retrieved context to Qwen2.5-3B for zero-shot audio classification, achieving 94% top-1 accuracy on ESC-50.

<p><a href="https://medium.com/@nidran" target="_blank" rel="noopener">Read the write-up on Medium →</a></p>

---
layout: post
title:  "Why Fast LLMs Are Really a Memory Problem"
date:   2026-06-16 09:00:00 +0700
categories: jekyll update
tags: [LLM, Inference, Efficiency, Systems]
---

<style>
.llm-post {
  --accent: #2b6cb0; --accent-soft: #ebf4ff; --line: #e2e2e2;
  --card: #ffffff; --muted: #5c5c5c; --ink: #1a1a1a; --code-bg: #f4f4f0;
}
.llm-post .standfirst { font-size: 1.15em; color: var(--muted); }
.llm-post .byline { font-size: 0.9em; color: var(--muted); border-top: 1px solid var(--line); padding-top: 14px; margin-bottom: 8px; }
.llm-post .lead { font-size: 1.08em; }
.llm-post h2 .part { display:block; font-size: 0.55em; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight:700; margin-bottom: 2px; }
.llm-post .callout { background: var(--accent-soft); border-left: 4px solid var(--accent); padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 22px 0; }
.llm-post .callout .label { font-weight: 700; color: var(--accent); font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.06em; }
.llm-post .keynum { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; margin: 22px 0; color: var(--ink); }
.llm-post .keynum .big { font-size: 1.55em; font-weight: 800; color: var(--accent); display:block; line-height:1.1; margin-bottom: 6px; }
.llm-post .toc { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px 22px; margin: 30px 0; color: var(--ink); }
.llm-post .toc h4 { margin: 0 0 10px; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
.llm-post .toc a { text-decoration: none; }
.llm-post figure.analogy { margin: 24px 0; padding: 16px 20px; background: #fffaf0; border: 1px dashed #e0c98a; border-radius: 10px; color: var(--ink); }
.llm-post figure.analogy figcaption { font-weight: 700; color: #9c6b1f; font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.llm-post .tldr { background: #f0f7f0; border: 1px solid #cce3cc; border-radius: 10px; padding: 16px 20px; margin: 24px 0; color: var(--ink); }
.llm-post .tldr .label { font-weight: 700; color: #2f6b2f; text-transform: uppercase; font-size: 0.78em; letter-spacing: 0.06em; }
.llm-post figure.diagram { margin: 28px 0; text-align: center; }
.llm-post figure.diagram svg { width: 100%; height: auto; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
.llm-post figure.diagram figcaption { font-size: 0.85em; color: var(--muted); margin-top: 8px; font-style: italic; }
.llm-post .dg-title { font: 700 16px -apple-system, "Segoe UI", sans-serif; fill: #1a1a1a; }
.llm-post .dg-label { font: 600 13px -apple-system, "Segoe UI", sans-serif; fill: #1a1a1a; }
.llm-post .dg-small { font: 500 12px -apple-system, "Segoe UI", sans-serif; fill: #5c5c5c; }
.llm-post .dg-num { font: 800 15px -apple-system, "Segoe UI", sans-serif; }
.llm-post table { width: 100%; border-collapse: collapse; margin: 22px 0; font-size: 0.85em; background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; color: var(--ink); }
.llm-post th, .llm-post td { text-align: left; padding: 9px 11px; border-bottom: 1px solid var(--line); }
.llm-post th { background: #f0f0ec; font-weight: 700; }
.llm-post tr:last-child td { border-bottom: none; }
</style>

<div class="llm-post" markdown="0">

<p class="standfirst">A beginner-friendly tour of how large language models are actually run — and the dozens of tricks engineers use to make them fast and cheap. No prior systems knowledge required.</p>

<p class="byline">A walk through the ideas in Alex Smola's "Efficiency in LLMs" tutorial (Columbia Machine Learning Summer School, 2026). All the numbers are his, verified by him as of mid-2026 — and, as he cheerfully warns, "likely wrong by December," because this field moves fast.</p>

<p class="lead">Here is a fact that surprises almost everyone the first time they hear it: when a modern AI model writes you an answer, the expensive chip running it spends most of its time <em>waiting</em>. Not computing. Waiting. Specifically, waiting for data to arrive from memory.</p>

<p>That single fact is the key that unlocks almost everything about how AI systems are built today. Once you understand <em>why</em> the chip waits, every optimization — the weird acronyms, the new chip designs, the clever serving software — turns out to be a variation on one move: <strong>move fewer bytes around</strong>.</p>

<p>This post is a guided tour. We'll start from absolute basics (what a chip even does, what "memory bandwidth" means) and build all the way up to the frontier techniques that let a model hold a million words of context. You don't need to know anything about GPUs going in. Let's go.</p>

<div class="toc">
  <h4>The tour ahead</h4>
  <ol>
    <li><a href="#part1">The big picture: why inference is a memory problem</a></li>
    <li><a href="#part2">Hardware: the physics of fast</a></li>
    <li><a href="#part3">Serving: many users, one copy of the model</a></li>
    <li><a href="#part4">Weight compression: same brain, fewer bytes</a></li>
    <li><a href="#part5">KV-cache compression: how to afford a million words</a></li>
    <li><a href="#part6">The wrap-up: numbers to remember</a></li>
  </ol>
</div>

<h2 id="part1"><span class="part">Part 1</span>The Big Picture</h2>

<h3>First, some vocabulary</h3>

<p>Let's define a few terms in plain language so nothing trips you up later.</p>

<ul>
  <li><strong>A model's "weights"</strong> are just a giant pile of numbers — the thing that got "learned" during training. Running the model means doing arithmetic with these numbers. A medium-sized model has billions of them.</li>
  <li><strong>A FLOP</strong> is one floating-point operation — basically one multiply or one add. Chips are rated by how many they can do per second. A top data-center GPU does roughly a <em>quadrillion</em> per second.</li>
  <li><strong>A GPU</strong> (graphics processing unit) is the chip that runs AI models. It has two relevant parts: thousands of tiny calculators (the "compute"), and a big bank of fast memory next to them (called HBM) where the weights live.</li>
  <li><strong>Memory bandwidth</strong> is how fast data can move from that memory bank into the calculators, measured in bytes per second. This turns out to be the hero (and villain) of the whole story.</li>
  <li><strong>A token</strong> is a chunk of text — roughly a word or part of a word. Models read and write text one token at a time.</li>
  <li><strong>Inference</strong> means <em>using</em> a trained model to generate answers (as opposed to <em>training</em>, which is teaching it in the first place). This whole post is about inference.</li>
</ul>

<h3>The imbalance that runs everything</h3>

<p>Take NVIDIA's H100, a workhorse data-center GPU. It can do about <strong>989 trillion math operations per second</strong>. Its memory can deliver about <strong>3.35 trillion bytes per second</strong>. Divide one by the other and you get a number worth tattooing on your arm:</p>

<div class="keynum">
  <span class="big">≈ 295 FLOPs per byte</span>
  In the time it takes the H100 to fetch a single byte from memory, it could have done about 295 math operations. So to keep its calculators busy, you need to feed it roughly 300 operations of work for every byte you pull in.
</div>

<figure class="diagram">
<svg viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The imbalance: while fetching one byte, the chip could do about 295 operations">
  <defs>
    <pattern id="dots" width="15" height="15" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.4" fill="#2b6cb0"/>
    </pattern>
  </defs>
  <text x="20" y="28" class="dg-title">The imbalance that runs everything</text>
  <text x="20" y="52" class="dg-small">While the chip fetches just ONE byte from memory...</text>
  <rect x="20" y="64" width="440" height="140" rx="10" fill="#ebf4ff" stroke="#2b6cb0" stroke-width="1.5"/>
  <rect x="36" y="80" width="408" height="108" fill="url(#dots)"/>
  <text x="240" y="230" text-anchor="middle" class="dg-label" fill="#2b6cb0">≈ 295 math operations it could have done</text>
  <text x="525" y="120" text-anchor="middle" class="dg-num" fill="#5c5c5c">vs</text>
  <circle cx="600" cy="134" r="9" fill="#d98a1f"/>
  <text x="600" y="170" text-anchor="middle" class="dg-label">1 byte</text>
  <text x="600" y="190" text-anchor="middle" class="dg-small">arrives</text>
</svg>
<figcaption>Each dot is one math operation. The chip can do hundreds in the time a single byte shows up — so during decode, when each byte feeds only one operation, it sits nearly idle.</figcaption>
</figure>

<p>Here's the problem. When a model generates text one token at a time, each weight gets used <em>exactly once</em> per token. You haul a number all the way in from memory, do one multiply with it, and you're done with it. That's one operation per byte fetched — when the chip wanted three hundred.</p>

<p>The result: the calculators sit idle, drumming their fingers, while the memory system frantically shovels weights at them as fast as it can. The chip is <strong>starving</strong>.</p>

<figure class="analogy">
  <figcaption>An analogy</figcaption>
  <p>Imagine a world-class chef (the compute) who can chop, sear, and plate at superhuman speed. But the ingredients arrive on a single narrow conveyor belt (the memory bandwidth). It doesn't matter how fast the chef is — dinner comes out at the speed of the belt. The chef spends the night waiting for the next onion.</p>
  <p>Making LLM inference faster is almost never about getting a faster chef. It's about putting <em>fewer, smaller ingredients</em> on the belt.</p>
</figure>

<p>This is the thesis of the entire tour: <strong>generating text is a memory-traffic problem, not a math problem.</strong> Nearly every trick we'll meet is just a clever way to move fewer bytes per token.</p>

<h3>Why anyone cares: the cost of serving</h3>

<p>Two reasons this matters enormously in practice.</p>

<p>First, <strong>price.</strong> The cost of running a model at a given quality level has dropped about <strong>10× every year</strong> — a roughly hundredfold drop over a few years. Most of that win didn't come from better models; it came from serving them more efficiently. The tricks in this post <em>are</em> the price drop.</p>

<p>Second, <strong>scale.</strong> You train a model once, but then you serve it to billions of requests. At that scale, the running cost dwarfs the training cost. Shaving a few bytes off each token, multiplied across billions of tokens a day, is the whole game.</p>

<h3>The two phases: prefill and decode</h3>

<p>When you send a prompt to a model, the work splits into two very different phases. Understanding this split is the most useful single idea in the post, so let's go slowly.</p>

<p><strong>Phase 1 — Prefill ("reading your prompt").</strong> The model reads your entire prompt at once. If your prompt is 40,000 tokens long, it processes all 40,000 in one big batch. Crucially, it reads each weight once but immediately reuses that weight across <em>all</em> 40,000 tokens. That's tons of math per byte — exactly what the chip likes. Prefill keeps the calculators busy. It is <strong>compute-bound</strong> (limited by how fast the chip can do math).</p>

<p><strong>Phase 2 — Decode ("writing the answer").</strong> Now the model writes its response one token at a time. To produce each new token, it must stream <em>every single weight</em> through the chip again — but it only uses each one once, for that one token. This is the starving scenario from above. Decode is <strong>memory-bound</strong> (limited by how fast memory can feed the chip).</p>

<div class="callout">
  <span class="label">The one-line summary</span>
  <p style="margin:8px 0 0;"><strong>Prefill speed is set by your chip's FLOPs. Decode speed is set by your chip's bytes-per-second.</strong> Two phases, two bottlenecks, one model. Almost everything that follows is about making decode less painful.</p>
</div>

<figure class="diagram">
<svg viewBox="0 0 700 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prefill reuses each weight across all prompt tokens; decode streams all weights for one token">
  <rect x="14" y="20" width="330" height="250" rx="12" fill="#eaf5ea" stroke="#3a8a3a" stroke-width="1.5"/>
  <text x="179" y="46" text-anchor="middle" class="dg-title" fill="#2f6b2f">PREFILL — reading your prompt</text>
  <rect x="40" y="70" width="46" height="150" rx="6" fill="#3a8a3a"/>
  <text x="63" y="150" text-anchor="middle" class="dg-small" fill="#fff" transform="rotate(-90 63 150)">all weights</text>
  <g fill="#bfe3bf" stroke="#3a8a3a">
    <rect x="150" y="78" width="34" height="22" rx="4"/>
    <rect x="150" y="106" width="34" height="22" rx="4"/>
    <rect x="150" y="134" width="34" height="22" rx="4"/>
    <rect x="150" y="162" width="34" height="22" rx="4"/>
    <rect x="150" y="190" width="34" height="22" rx="4"/>
  </g>
  <g stroke="#3a8a3a" stroke-width="1.5">
    <line x1="86" y1="100" x2="150" y2="89"/>
    <line x1="86" y1="120" x2="150" y2="117"/>
    <line x1="86" y1="140" x2="150" y2="145"/>
    <line x1="86" y1="160" x2="150" y2="173"/>
    <line x1="86" y1="180" x2="150" y2="201"/>
  </g>
  <text x="245" y="120" class="dg-small" fill="#2f6b2f">each weight</text>
  <text x="245" y="138" class="dg-small" fill="#2f6b2f">reused across</text>
  <text x="245" y="156" class="dg-small" fill="#2f6b2f">MANY tokens</text>
  <text x="179" y="252" text-anchor="middle" class="dg-label" fill="#2f6b2f">chip stays busy ✓</text>
  <rect x="356" y="20" width="330" height="250" rx="12" fill="#fbeaea" stroke="#c0392b" stroke-width="1.5"/>
  <text x="521" y="46" text-anchor="middle" class="dg-title" fill="#a83228">DECODE — writing the answer</text>
  <rect x="382" y="70" width="46" height="150" rx="6" fill="#c0392b"/>
  <text x="405" y="150" text-anchor="middle" class="dg-small" fill="#fff" transform="rotate(-90 405 150)">all weights</text>
  <rect x="540" y="134" width="40" height="26" rx="4" fill="#f3c0bb" stroke="#c0392b"/>
  <text x="560" y="152" text-anchor="middle" class="dg-small">1 tok</text>
  <g stroke="#c0392b" stroke-width="1.5">
    <line x1="428" y1="95" x2="540" y2="143"/>
    <line x1="428" y1="120" x2="540" y2="147"/>
    <line x1="428" y1="145" x2="540" y2="150"/>
    <line x1="428" y1="170" x2="540" y2="153"/>
    <line x1="428" y1="195" x2="540" y2="157"/>
  </g>
  <text x="600" y="120" class="dg-small" fill="#a83228">every weight</text>
  <text x="600" y="138" class="dg-small" fill="#a83228">streamed, used</text>
  <text x="600" y="156" class="dg-small" fill="#a83228">just ONCE</text>
  <text x="521" y="252" text-anchor="middle" class="dg-label" fill="#a83228">chip starves, waits ✗</text>
</svg>
<figcaption>Same model, two phases. Prefill spreads each weight-read across thousands of prompt tokens (great use of the chip). Decode drags every weight in to produce a single token (terrible use of the chip) — which is why generating text is slow.</figcaption>
</figure>

<p>Let's put real numbers on it, for a real 8-billion-parameter model (Qwen3-8B) on an H100:</p>

<table>
  <tr><th>Quantity</th><th>Prefill (40k-token prompt)</th><th>Decode (per token)</th></tr>
  <tr><td>What it's limited by</td><td>Math (compute)</td><td>Memory traffic (bandwidth)</td></tr>
  <tr><td>Work done</td><td>~750 trillion operations</td><td>~16 billion operations</td></tr>
  <tr><td>Bytes moved</td><td>weights read once</td><td>~22 GB swept every token</td></tr>
  <tr><td>Operations per byte</td><td>hundreds (chip is happy)</td><td>less than 1 (chip starves)</td></tr>
  <tr><td>Resulting speed</td><td>~0.76 seconds total</td><td>~6.6 ms each → ~150 tokens/sec</td></tr>
</table>

<p>Notice the decode line: to produce <em>one</em> token, the chip moves about 22 gigabytes of data (16 GB of weights plus 6 GB of "memory of the conversation" — we'll get to that). It does only 16 billion operations of math with it. That's well under one operation per byte. The H100, capable of a quadrillion operations a second, is running at less than 1% of its math potential during decode. It's a Ferrari in a traffic jam.</p>

<h3>Arithmetic intensity and the "roofline"</h3>

<p>Engineers have a name for "operations per byte": <strong>arithmetic intensity</strong>. It's the single number that decides whether your chip is starving or thriving.</p>

<p>There's a famous picture called a <strong>roofline</strong> that captures this. Imagine a graph: the more operations you do per byte (intensity), the more of the chip's power you can actually use — up to a ceiling. The graph has two parts: a <strong>sloped part</strong> on the left (the "bandwidth wall," where your speed is capped by memory and rises with intensity), and a <strong>flat part</strong> on the right (the "compute ceiling," where you're limited only by raw math speed).</p>

<p>The corner where they meet sits at that magic number, ~295 operations per byte for the H100. <strong>Prefill lives way out on the flat ceiling. Decode sits far down on the sloped wall</strong> — using a tiny fraction of the chip. Same model, same chip, two completely different worlds depending on the phase.</p>

<figure class="diagram">
<svg viewBox="0 0 700 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Roofline chart: decode sits low on the bandwidth slope, prefill on the compute ceiling">
  <text x="350" y="26" text-anchor="middle" class="dg-title">The roofline: where each phase lands</text>
  <line x1="80" y1="290" x2="660" y2="290" stroke="#5c5c5c" stroke-width="1.5"/>
  <line x1="80" y1="60" x2="80" y2="290" stroke="#5c5c5c" stroke-width="1.5"/>
  <text x="370" y="325" text-anchor="middle" class="dg-small">arithmetic intensity (operations per byte) →</text>
  <text x="28" y="175" text-anchor="middle" class="dg-small" transform="rotate(-90 28 175)">usable chip speed →</text>
  <polyline points="80,290 410,90 660,90" fill="none" stroke="#2b6cb0" stroke-width="3"/>
  <line x1="410" y1="90" x2="410" y2="290" stroke="#2b6cb0" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
  <text x="410" y="308" text-anchor="middle" class="dg-small" fill="#2b6cb0">ridge ≈ 295</text>
  <text x="225" y="245" text-anchor="middle" class="dg-small" fill="#2b6cb0">bandwidth wall</text>
  <text x="540" y="80" text-anchor="middle" class="dg-small" fill="#2b6cb0">compute ceiling</text>
  <circle cx="135" cy="258" r="8" fill="#c0392b"/>
  <text x="150" y="252" class="dg-label" fill="#a83228">DECODE</text>
  <text x="150" y="270" class="dg-small" fill="#a83228">&lt;1 op/byte — almost idle</text>
  <circle cx="560" cy="90" r="8" fill="#3a8a3a"/>
  <text x="548" y="125" text-anchor="middle" class="dg-label" fill="#2f6b2f">PREFILL</text>
  <text x="548" y="142" text-anchor="middle" class="dg-small" fill="#2f6b2f">hits the ceiling</text>
</svg>
<figcaption>Below the ridge you're limited by memory speed; above it, by raw math. Decode is stranded far down the slope using under 1% of the chip's math power, while prefill bumps against the ceiling.</figcaption>
</figure>

<h3>The KV cache: the model's short-term memory</h3>

<p>One more concept and we've got the full picture. Where did that extra 6 GB in the decode step come from?</p>

<p>When a model reads text, for every token it computes two helper vectors called <strong>K</strong> and <strong>V</strong> (keys and values). These let later tokens "pay attention" to earlier ones. Here's the thing: a token's K and V never change once computed. So instead of recomputing them every step, the model <strong>computes them once and stores them</strong>. That store is the <strong>KV cache</strong>.</p>

<figure class="analogy">
  <figcaption>An analogy</figcaption>
  <p>The KV cache is the model's running notes on the conversation so far. Every time it writes a new word, it glances back over all its notes. The longer the conversation, the thicker the notebook — and the longer it takes to skim before writing each new word.</p>
</figure>

<p>The catch: the KV cache <em>grows with the length of the conversation</em>. For our 8B model it's about 147 KB per token. At 40,000 tokens that's ~6 GB. At a million tokens it would be <strong>147 GB</strong> — nearly ten times bigger than the model's own weights. And during decode, the chip has to read the <em>entire</em> KV cache for every single new token. This is why long conversations get slow and expensive, and why an entire section of this post (Part 5) is devoted to shrinking it.</p>

<figure class="diagram">
<svg viewBox="0 0 700 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The KV cache grows with conversation length and eventually dwarfs the model weights">
  <text x="350" y="26" text-anchor="middle" class="dg-title">The notebook outgrows the brain</text>
  <line x1="80" y1="270" x2="660" y2="270" stroke="#5c5c5c" stroke-width="1.5"/>
  <line x1="80" y1="50" x2="80" y2="270" stroke="#5c5c5c" stroke-width="1.5"/>
  <text x="370" y="305" text-anchor="middle" class="dg-small">conversation length (tokens) →</text>
  <text x="28" y="160" text-anchor="middle" class="dg-small" transform="rotate(-90 28 160)">memory used →</text>
  <line x1="80" y1="210" x2="660" y2="210" stroke="#3a8a3a" stroke-width="3"/>
  <text x="590" y="200" class="dg-small" fill="#2f6b2f">weights (~16 GB, fixed)</text>
  <polyline points="80,268 200,250 330,215 430,170 520,110 620,60" fill="none" stroke="#c0392b" stroke-width="3"/>
  <text x="470" y="120" class="dg-small" fill="#a83228">KV cache (grows forever)</text>
  <circle cx="400" cy="210" r="6" fill="#1a1a1a"/>
  <text x="400" y="235" text-anchor="middle" class="dg-small">cache passes the model</text>
  <text x="620" y="48" text-anchor="middle" class="dg-num" fill="#c0392b">147 GB</text>
  <text x="620" y="290" text-anchor="middle" class="dg-small">@ 1M tokens</text>
</svg>
<figcaption>The model's weights are a fixed size. The KV cache keeps growing with every token of the conversation — and past roughly a hundred thousand tokens it becomes bigger than the model itself.</figcaption>
</figure>

<h3>Two consequences worth previewing</h3>

<p><strong>Consequence 1: the two phases want different machines.</strong> Prefill is hungry for math, so it wants a chip stacked with calculators. Decode is hungry for memory speed and capacity, so it wants fat, fast memory. A natural idea follows: stop running them on the same box. Split them into a "prefill pool" and a "decode pool." This is called <strong>disaggregated serving</strong>, and we'll build it in Part 3.</p>

<p><strong>Consequence 2: the local-inference loophole.</strong> If decode just wants memory bandwidth and capacity (not raw math), then for running a model at home on a single chat, a device with lots of unified memory can beat an expensive GPU. A Mac with 128 GB of memory can run a 70-billion-parameter model that literally won't fit on a $2,000 gaming card — because the gaming card, for all its speed, doesn't have enough room. (The catch: prefill on these home devices is painfully slow. On one such box, prefill ran ~390× faster than decode — same chip, wildly different phases.)</p>

<div class="callout">
  <span class="label">Hold onto one number</span>
  <p style="margin:8px 0 0;"><strong>~295 FLOPs per byte.</strong> An H100 can do ~295 math operations in the time it takes to fetch a single byte. Everything that follows is about making that ratio survivable.</p>
</div>

<h2 id="part2"><span class="part">Part 2</span>Hardware: The Physics of Fast</h2>

<p>If decode is bottlenecked by memory, the obvious move is "buy better memory." This part is about what the hardware can and can't do — and why money alone won't save you.</p>

<h3>Why memory has to sit right next to the chip</h3>

<p>Modern GPUs use a kind of memory called <strong>HBM</strong> (High Bandwidth Memory). The trick is physical: instead of putting memory chips inches away on the circuit board, HBM stacks the memory dies micrometers from the processor on a shared base. Distance is the enemy of bandwidth, so keeping memory practically touching the chip is how you hit trillions of bytes per second.</p>

<p>This leads to a beautiful, frustrating geometric fact engineers call the <strong>shoreline problem</strong>. A chip's computing power scales with its <em>area</em> (the calculators fill the interior). But its connections to the outside world — memory, other chips — can only happen at the <em>edge</em>. Area grows as the square of the chip's size; the edge grows only linearly. So every time chips get bigger or finer, they gain compute faster than they gain the ability to feed it. The starvation gets structurally worse with each generation.</p>

<h3>Every chip boundary costs you an order of magnitude</h3>

<p>Data moves at wildly different speeds depending on how far it has to travel. Roughly, in 2026:</p>

<table>
  <tr><th>Path</th><th>Speed</th><th>Relative</th></tr>
  <tr><td>On-package HBM (memory → chip)</td><td>~8,000 GB/s</td><td>baseline</td></tr>
  <tr><td>NVLink (chip → neighbor chip)</td><td>~1,800 GB/s</td><td>~4× slower</td></tr>
  <tr><td>PCIe (chip → rest of computer)</td><td>~128 GB/s</td><td>~60× slower</td></tr>
  <tr><td>Network card (box → box)</td><td>~100 GB/s</td><td>~80× slower</td></tr>
  <tr><td>SSD (storage)</td><td>~14 GB/s</td><td>~570× slower</td></tr>
</table>

<p>The lesson is blunt: <strong>keep the bytes home.</strong> Every time data crosses a chip boundary, you pay roughly a 10× speed penalty. A huge amount of systems design is just choreography to avoid those crossings.</p>

<h3>The cruel scaling laws</h3>

<p>Here's why you can't simply wait for better hardware to fix everything. Per chip generation, three things improve at three different rates:</p>

<table>
  <tr><th>What</th><th>Improvement per generation</th></tr>
  <tr><td>Compute (math speed)</td><td>~4×</td></tr>
  <tr><td>Bandwidth (memory speed)</td><td>~2×</td></tr>
  <tr><td>Capacity (memory size)</td><td>less than 1.4×</td></tr>
</table>

<p>Compute races ahead. Bandwidth limps behind. Capacity barely moves (and a 2025–26 memory-chip shortage made every gigabyte pricier). Since decode cares about bandwidth and capacity — the two laggards — <strong>the imbalance gets worse every year, not better.</strong> Money buys you time, not escape. The real fixes have to be clever, not just expensive. That's the rest of the post.</p>

<h3>A genuinely brilliant trick: FlashAttention</h3>

<p>Not every hardware-era win is about new silicon. Some are about using existing silicon smarter. The best example is <strong>FlashAttention</strong>, and it's worth understanding because it shows the whole philosophy in miniature.</p>

<p>Remember attention — where each token looks at every other token? Done naively, this builds a giant table of size (number of tokens) × (number of tokens). For a 40,000-token prompt, that table is 3.2 GB <em>per attention head, per layer</em>, and the naive method writes it out to slow memory and reads it back several times. It's pure wasted memory traffic.</p>

<p>FlashAttention's insight: never build the whole table. Instead, stream the data through the chip's tiny-but-blazing-fast on-chip scratchpad in small tiles, computing the answer incrementally and keeping only a running summary. The math comes out identical; the memory traffic collapses. The payoff was huge — successive versions took attention from using ~25% of the chip's potential up to ~85%. You almost certainly use it every time you talk to an AI; it's built into the standard libraries.</p>

<figure class="analogy">
  <figcaption>The pattern to notice</figcaption>
  <p>FlashAttention didn't add a single transistor. It just rearranged the work so that fewer bytes crossed the slow boundary. That is the same move, over and over, for the rest of this post.</p>
</figure>

<h3>Smaller numbers, faster chips: precision formats</h3>

<p>Here's a lever that helps both bottlenecks at once. The "numbers" in a model don't have to be stored at full precision. A weight can be a chunky 16-bit number, or a leaner 8-bit one, or even a tiny 4-bit one.</p>

<p>Why does this help twice over? First, smaller numbers mean <strong>fewer bytes to move</strong> — direct relief for the memory bottleneck. Second, the silicon needed to multiply two numbers grows with the <em>square</em> of their size, so smaller numbers also mean <strong>faster math</strong>. Low precision wins on both axes.</p>

<p>How small can you go? A 4-bit number can represent only <strong>16 distinct values</strong> — you can literally list them all. The obvious worry is that this is too coarse to preserve a model's quality. The clever fix is <strong>block scaling</strong>: instead of one scale factor for everything, you give each small group of weights (say 16 or 32 of them) its own scale, so the 16 available levels can hug the actual range of that local group. Modern formats called MXFP4 and NVFP4 do exactly this, and they make 4-bit weights genuinely usable. One open model (gpt-oss) ships its weights this way, letting a 120-billion-parameter model fit on a single 80 GB GPU.</p>

<h3>The deepest reason of all: moving data costs energy</h3>

<p>If you remember one fact from this section, make it this one. Compare the energy cost of operations on a chip:</p>

<div class="keynum">
  <span class="big">1 memory read ≈ 500 multiplies</span>
  Reading one number from main memory (DRAM) costs roughly 500 times the energy of actually multiplying two numbers together. Arithmetic is nearly free. <strong>Moving the operands is the entire budget.</strong>
</div>

<figure class="diagram">
<svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="One memory read costs about 500 times the energy of one multiply">
  <text x="20" y="28" class="dg-title">Energy per operation</text>
  <text x="20" y="66" class="dg-small">one multiply</text>
  <rect x="160" y="52" width="8" height="20" rx="2" fill="#3a8a3a"/>
  <text x="178" y="67" class="dg-small" fill="#2f6b2f">~3.7 pJ</text>
  <text x="20" y="116" class="dg-small">one memory read</text>
  <rect x="160" y="102" width="500" height="20" rx="2" fill="#c0392b"/>
  <text x="408" y="117" text-anchor="middle" class="dg-num" fill="#fff">~2000 pJ  ≈ 500 multiplies</text>
  <text x="20" y="160" class="dg-small">The takeaway: doing the math is basically free. Fetching the numbers is what costs time and power.</text>
</svg>
<figcaption>This is the deepest reason every trick in this post tries to move fewer bytes — the fetch, not the arithmetic, dominates the bill.</figcaption>
</figure>

<p>This is the physics underneath everything. The chip would happily do far more math; it's the <em>fetching</em> that costs time and watts. Which is why, one more time: every technique in this post moves fewer bytes.</p>

<div class="tldr">
  <span class="label">Hardware TL;DR</span>
  <p style="margin:8px 0 0;">Compute grows ~4× per generation, bandwidth ~2×, capacity barely at all. The gap the model has to survive keeps widening. Hardware raises the ceiling; the clever algorithms in the next three parts lower how far below it you're forced to live.</p>
</div>

<h2 id="part3"><span class="part">Part 3</span>Serving: Many Users, One Copy of the Model</h2>

<p>So far we've imagined one user, one request. Reality is thousands of users hitting one fleet of GPUs at once. "Serving" is the software layer that juggles them. Its entire job is to answer one question, over and over: <em>where is the GPU stalling on memory, or recomputing something we already had?</em></p>

<h3>The metrics that matter</h3>

<p>Two numbers define a good experience. <strong>Time to first token (TTFT)</strong> — how long before you see <em>any</em> response — is the prefill phase; under ~1 second "feels instant." <strong>Time per output token (TPOT)</strong> — how fast words then stream out — is decode; around 20–50 ms per token matches comfortable reading speed. The serving system's challenge is hitting both targets for many users at once, on shared hardware, without wasting a single GPU-cycle. Here are the five big moves it makes.</p>

<h3>Move 1: Batch continuously</h3>

<p>Recall that during decode, all the weights get streamed in anyway. If you process several users' requests <em>together</em> in one batch, they all share that single weight-read. The expensive memory traffic gets amortized across many users — free throughput. This is the core reason serving is efficient at all.</p>

<p>The naive way ("static batching") waits for a whole group of requests to finish before starting the next group — so a fast request sits idle waiting for a slow neighbor. The fix, <strong>continuous batching</strong>, re-forms the batch every single step: the moment one request finishes, a new one takes its slot. No idle seats. This one change delivered up to 20×+ throughput improvements and is now universal.</p>

<figure class="diagram">
<svg viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Static batching wastes GPU slots; continuous batching reuses them instantly">
  <text x="350" y="24" text-anchor="middle" class="dg-title">Keeping every GPU slot full</text>
  <text x="20" y="58" class="dg-label" fill="#a83228">Static: wait for the slowest, then start fresh</text>
  <g>
    <rect x="40" y="70" width="180" height="20" rx="3" fill="#2b6cb0"/>
    <rect x="40" y="94" width="90" height="20" rx="3" fill="#2b6cb0"/><rect x="130" y="94" width="90" height="20" rx="3" fill="#eee" stroke="#ccc"/>
    <rect x="40" y="118" width="140" height="20" rx="3" fill="#2b6cb0"/><rect x="180" y="118" width="40" height="20" rx="3" fill="#eee" stroke="#ccc"/>
    <rect x="40" y="142" width="60" height="20" rx="3" fill="#2b6cb0"/><rect x="100" y="142" width="120" height="20" rx="3" fill="#eee" stroke="#ccc"/>
  </g>
  <line x1="220" y1="64" x2="220" y2="168" stroke="#5c5c5c" stroke-dasharray="3 3"/>
  <text x="248" y="120" class="dg-small" fill="#a83228">grey = idle,</text>
  <text x="248" y="136" class="dg-small" fill="#a83228">wasted GPU</text>
  <text x="20" y="200" class="dg-label" fill="#2f6b2f">Continuous: a finished slot is refilled instantly</text>
  <g>
    <rect x="40" y="212" width="120" height="20" rx="3" fill="#3a8a3a"/><rect x="160" y="212" width="100" height="20" rx="3" fill="#7bbf7b"/>
    <rect x="40" y="236" width="70" height="20" rx="3" fill="#3a8a3a"/><rect x="110" y="236" width="80" height="20" rx="3" fill="#7bbf7b"/><rect x="190" y="236" width="70" height="20" rx="3" fill="#5aa85a"/>
  </g>
  <text x="290" y="232" class="dg-small" fill="#2f6b2f">new requests join</text>
  <text x="290" y="248" class="dg-small" fill="#2f6b2f">the moment a slot frees</text>
</svg>
<figcaption>Requests finish at different times. Static batching leaves slots idle until the whole group is done; continuous batching slots a new request in the instant one finishes — so the expensive shared weight-read is never wasted.</figcaption>
</figure>

<p>But batching has a tension. Sharing the weight-read is great, but <em>each</em> request carries its own KV cache, and those don't share. Batch 32 conversations and you might need 192 GB just for KV. So the bigger your batch, the more the KV cache — not the weights — becomes the thing choking your memory. Managing that tension is most of the rest of serving (and Part 5).</p>

<h3>Move 2: Page the KV cache</h3>

<p>Early systems reserved one big contiguous block of memory per request, sized for the maximum possible length. Most requests are short, so most of that reserved space sat empty — only 20–40% of KV memory actually held real data. The rest was waste, and that waste capped how many users you could serve.</p>

<p>The fix, <strong>PagedAttention</strong> (the idea behind the popular vLLM system), borrows a trick from how your operating system manages memory. Instead of one big reservation, chop KV memory into small fixed-size blocks handed out on demand, with a lookup table mapping each request to its scattered blocks. Fragmentation nearly vanishes, and you can pack far more users in. A bonus: if two requests share the same opening text, they can literally <em>share</em> the same physical blocks until they diverge.</p>

<h3>Move 3: Cache shared prefixes</h3>

<p>That sharing idea is huge, because in practice an enormous fraction of tokens are repeats. The same system prompt prepended to every chat. The same few-shot examples on every query. The same conversation history replayed each turn. The same tool descriptions for an AI agent. Re-doing the prefill for identical text every time is pure waste.</p>

<p><strong>Prefix caching</strong> stores the KV cache of text you've already processed and reuses it. The SGLang system organizes this cleverly with a "radix tree" (think of a filing system where shared beginnings share a folder path), so any request that starts with text you've seen skips straight past it. A cache hit means skipped prefill: lower latency, freed compute, bigger batches. On workloads with lots of shared text, this delivered up to 5× more throughput.</p>

<div class="callout">
  <span class="label">You've already paid for this</span>
  <p style="margin:8px 0 0;">This is why AI providers charge far less for "cached" input. Anthropic charges as little as 10% of the normal price for cached tokens; OpenAI and Google have similar discounts. Your bill is, quite literally, a cache-hit-rate report. Structuring your prompt with the stable parts (system prompt, documents, examples) <em>first</em> is how you get them cached — and cut your costs.</p>
</div>

<h3>Move 4: Don't let one long prompt freeze everyone</h3>

<p>If one user sends a 40,000-token prompt, a naive scheduler will grind through that entire prefill while every other user's response freezes mid-sentence. The fix, <strong>chunked prefill</strong>, slices the giant prompt into bite-sized chunks and interleaves them with everyone else's decode steps. Each step does a fixed amount of work — a little prefill plus the ongoing decodes — so no one stalls.</p>

<h3>Move 5: Disaggregate the phases</h3>

<p>Here's where the Part 1 insight pays off. Prefill wants compute; decode wants memory bandwidth. So run them on <em>separate</em> pools of machines, each tuned for its job, and ship the KV cache from the prefill pool to the decode pool when handing off. A "conductor" routes each request to a good (prefill machine, decode machine) pair. This architecture — pioneered by systems called DistServe and Mooncake — delivered large throughput gains in production at companies serving over 100 billion tokens a day.</p>

<h3>A bonus move: speculative decoding</h3>

<p>This one is delightfully sneaky. During decode the GPU's calculators are mostly idle (remember, it's starving for memory, not math). So... spend those free FLOPs. A small, cheap "draft" model quickly guesses the next handful of tokens. Then the big, real model checks all of those guesses <em>in a single forward pass</em> — which costs the same memory traffic as producing one token, but validates several at once. Where the guesses are right (which is often), you got multiple tokens for the price of one.</p>

<p>The beautiful part: there's a precise statistical rule for accepting and rejecting guesses that guarantees the final output is <em>exactly</em> the distribution the big model would have produced on its own. It's a pure speedup with no quality cost — typically 2–5×. The one caveat: if your batch is already huge, the calculators aren't idle anymore, so verifying wrong guesses becomes pure overhead. Speculation helps when you have FLOPs to spare; measure before turning it on at scale.</p>

<div class="tldr">
  <span class="label">Serving TL;DR</span>
  <p style="margin:8px 0 0;">Five moves to keep the GPU fed: batch continuously, page the KV cache, cache shared prefixes, route requests with the same prefix to the same machine, and disaggregate the two phases. Every one of them buys back arithmetic intensity — more useful work per byte dragged out of memory.</p>
</div>

<h2 id="part4"><span class="part">Part 4</span>Weight Compression: Same Brain, Fewer Bytes</h2>

<p>Serving made the <em>system</em> efficient. Now we make the <em>model</em> itself cheaper to move. Since decode is bottlenecked by streaming all the weights every token, the goal is simple: <strong>fewer bytes of weights.</strong> There are two independent ways to do it, and you can use both.</p>

<h3>Where the weight bytes actually live</h3>

<p>Crack open a typical model and you find that the <strong>feed-forward network (FFN)</strong> — the part that "thinks" about each token's features — hogs roughly two-thirds of all the weights. For our 8B example: ~66% FFN, ~18% attention, the rest embeddings. Every token currently runs through the entire FFN. So the FFN is the first place to hunt for savings.</p>

<h3>Idea 1: Mixture of Experts (use fewer weights per token)</h3>

<p>What if, instead of one giant FFN that every token must run through, you had <em>many</em> smaller FFNs ("experts") and each token used only a few of them?</p>

<p>That's a <strong>Mixture of Experts (MoE)</strong>. A little router looks at each token and picks, say, the 8 most relevant experts out of 128. The token only runs through those 8. You keep all the "knowledge" of a huge model, but each token only pays for a small slice of it.</p>

<figure class="diagram">
<svg viewBox="0 0 700 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A router sends each token to only a few of many experts">
  <text x="350" y="26" text-anchor="middle" class="dg-title">Mixture of Experts: only a few wake up</text>
  <rect x="30" y="115" width="60" height="30" rx="5" fill="#2b6cb0"/>
  <text x="60" y="135" text-anchor="middle" class="dg-small" fill="#fff">token</text>
  <rect x="130" y="105" width="80" height="50" rx="8" fill="#ebf4ff" stroke="#2b6cb0" stroke-width="1.5"/>
  <text x="170" y="127" text-anchor="middle" class="dg-small" fill="#2b6cb0">router</text>
  <text x="170" y="143" text-anchor="middle" class="dg-small" fill="#2b6cb0">picks top-k</text>
  <line x1="90" y1="130" x2="130" y2="130" stroke="#2b6cb0" stroke-width="2"/>
  <g class="dg-small">
    <rect x="280" y="40" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="312" y="60" text-anchor="middle" fill="#999">expert</text>
    <rect x="280" y="80" width="64" height="30" rx="5" fill="#3a8a3a"/><text x="312" y="100" text-anchor="middle" fill="#fff">expert ✓</text>
    <rect x="280" y="120" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="312" y="140" text-anchor="middle" fill="#999">expert</text>
    <rect x="280" y="160" width="64" height="30" rx="5" fill="#3a8a3a"/><text x="312" y="180" text-anchor="middle" fill="#fff">expert ✓</text>
    <rect x="280" y="200" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="312" y="220" text-anchor="middle" fill="#999">expert</text>
    <rect x="380" y="40" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="412" y="60" text-anchor="middle" fill="#999">expert</text>
    <rect x="380" y="80" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="412" y="100" text-anchor="middle" fill="#999">expert</text>
    <rect x="380" y="120" width="64" height="30" rx="5" fill="#3a8a3a"/><text x="412" y="140" text-anchor="middle" fill="#fff">expert ✓</text>
    <rect x="380" y="160" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="412" y="180" text-anchor="middle" fill="#999">expert</text>
    <rect x="380" y="200" width="64" height="30" rx="5" fill="#eee" stroke="#ccc"/><text x="412" y="220" text-anchor="middle" fill="#999">expert</text>
  </g>
  <text x="412" y="252" text-anchor="middle" class="dg-small">128 experts stored... only a few run per token</text>
  <g stroke="#3a8a3a" stroke-width="2">
    <line x1="210" y1="125" x2="280" y2="95"/>
    <line x1="210" y1="130" x2="280" y2="175"/>
    <line x1="210" y1="135" x2="380" y2="135"/>
  </g>
  <rect x="560" y="115" width="110" height="40" rx="8" fill="#ebf4ff" stroke="#2b6cb0" stroke-width="1.5"/>
  <text x="615" y="140" text-anchor="middle" class="dg-small" fill="#2b6cb0">combined output</text>
  <g stroke="#3a8a3a" stroke-width="2">
    <line x1="344" y1="95" x2="560" y2="130"/>
    <line x1="344" y1="175" x2="560" y2="140"/>
    <line x1="444" y1="135" x2="560" y2="135"/>
  </g>
</svg>
<figcaption>All the experts sit in memory (that's the capacity cost), but each token only streams through the handful the router picks (that's the savings). Huge total knowledge, small per-token bill.</figcaption>
</figure>

<figure class="analogy">
  <figcaption>An analogy</figcaption>
  <p>A dense model is one generalist doctor who personally handles every patient. An MoE is a hospital with 128 specialists and a triage nurse who sends each patient to the right few. The hospital knows far more in total, but any single patient only occupies a couple of specialists.</p>
</figure>

<p>Concretely, compare two real models. The dense Qwen3-8B uses all 8.2 billion parameters for every token. Its MoE sibling, Qwen3-30B-A3B, stores 30.5 billion parameters total but activates only ~3.35 billion per token. It's ~4× bigger in knowledge yet does <em>less</em> work per token.</p>

<p>The trade-off: MoE swaps memory <em>capacity</em> for compute. You must store all 30 billion parameters in memory (even the idle experts), but you stream far fewer per token. That's a great deal when memory capacity is cheap relative to bandwidth — which is exactly the situation modern hardware is in. The sparsity has been climbing fast: from using 1-in-4 of the weights a few years ago to as little as 1-in-31 in the newest models.</p>

<p>There's a subtlety worth knowing: training an MoE requires <strong>load balancing</strong>, or the router lazily keeps picking the same few experts while the rest starve and die. Various tricks (an auxiliary loss, or a per-expert bias nudged toward under-used experts) keep all the experts alive and learning.</p>

<h3>Idea 2: Quantization (use fewer bits per weight)</h3>

<p>The other axis: store each individual weight in fewer bits. Go from 16 bits to 8 and you halve the bytes streamed — halving the decode floor and fitting on a smaller GPU. Go to 4 bits and you quarter it. This is <strong>quantization</strong>, and it's where a lot of beautiful engineering lives.</p>

<p>First, a free win. It turns out you can't usefully <code>gzip</code> a model — the precise mantissa bits look like random noise and don't compress. <em>But</em> the exponent bits (which set the rough magnitude) are highly predictable in a trained model — only 2–3 bits of real information in an 8-bit field. So you can losslessly squeeze a model down to about <strong>4.7 bits per weight</strong> with no quality loss at all. Below that floor, though, information genuinely has to be thrown away. The art is throwing away the bits that don't matter.</p>

<h3>The villain: outliers</h3>

<p>Quantization means rounding every weight onto a coarse grid of allowed values. The problem is <strong>outliers</strong>: a single unusually large weight forces the grid to stretch wide enough to include it, which makes the spacing coarse for the hundreds of ordinary weights around it. One heavy hitter ruins the precision for all its neighbors. Every serious quantization method is a different answer to the outlier problem:</p>

<figure class="diagram">
<svg viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="One outlier weight stretches the rounding grid and coarsens it for all the others">
  <text x="350" y="24" text-anchor="middle" class="dg-title">Why one outlier wrecks 4-bit quantization</text>
  <text x="20" y="60" class="dg-label" fill="#2f6b2f">No outlier: fine grid, weights round well</text>
  <line x1="40" y1="100" x2="540" y2="100" stroke="#5c5c5c"/>
  <g stroke="#3a8a3a" stroke-width="1.5">
    <line x1="70" y1="92" x2="70" y2="108"/><line x1="130" y1="92" x2="130" y2="108"/>
    <line x1="190" y1="92" x2="190" y2="108"/><line x1="250" y1="92" x2="250" y2="108"/>
    <line x1="310" y1="92" x2="310" y2="108"/><line x1="370" y1="92" x2="370" y2="108"/>
    <line x1="430" y1="92" x2="430" y2="108"/><line x1="490" y1="92" x2="490" y2="108"/>
  </g>
  <g fill="#2b6cb0">
    <circle cx="95" cy="100" r="4"/><circle cx="165" cy="100" r="4"/><circle cx="205" cy="100" r="4"/>
    <circle cx="280" cy="100" r="4"/><circle cx="340" cy="100" r="4"/><circle cx="455" cy="100" r="4"/>
  </g>
  <text x="560" y="104" class="dg-small">grid levels close together</text>
  <text x="20" y="170" class="dg-label" fill="#a83228">One outlier: grid stretches, bulk gets crushed</text>
  <line x1="40" y1="210" x2="650" y2="210" stroke="#5c5c5c"/>
  <g stroke="#c0392b" stroke-width="1.5">
    <line x1="70" y1="202" x2="70" y2="218"/><line x1="210" y1="202" x2="210" y2="218"/>
    <line x1="350" y1="202" x2="350" y2="218"/><line x1="490" y1="202" x2="490" y2="218"/>
    <line x1="630" y1="202" x2="630" y2="218"/>
  </g>
  <g fill="#2b6cb0">
    <circle cx="90" cy="210" r="4"/><circle cx="100" cy="210" r="4"/><circle cx="112" cy="210" r="4"/>
    <circle cx="125" cy="210" r="4"/><circle cx="138" cy="210" r="4"/><circle cx="150" cy="210" r="4"/>
  </g>
  <circle cx="630" cy="210" r="7" fill="#d98a1f"/>
  <text x="630" y="240" text-anchor="middle" class="dg-small" fill="#9c6b1f">outlier</text>
  <text x="120" y="245" text-anchor="middle" class="dg-small">127 normal weights now share far fewer levels</text>
</svg>
<figcaption>The grid has only a fixed number of rungs. One unusually large weight forces the rungs far apart, so all the ordinary weights get squashed onto just a couple of them — losing precision. GPTQ, AWQ, and rotation are three different ways to defuse this.</figcaption>
</figure>

<p><strong>GPTQ — compensate.</strong> After rounding each weight, it calculates the error introduced and pushes a correction onto the not-yet-rounded weights. It uses calibration data to figure out which errors actually matter for the model's output, turning quantization into a tidy least-squares problem. Result: 4-bit weights with almost no quality loss, and a 175-billion-parameter model fitting on a single GPU.</p>

<p><strong>AWQ — protect.</strong> It notices that only ~1% of weight channels carry most of the important signal. It identifies them (by which ones see the biggest activations) and rescales them so rounding can't hurt them. Prevent the mistake instead of fixing it after.</p>

<p><strong>Rotation — remove.</strong> The most elegant: multiply the weights by a carefully chosen rotation matrix. A rotation doesn't change the model's output, but it <em>smears</em> the outliers out across all the coordinates, turning a spiky distribution into smooth, near-Gaussian "dust" with no outliers left to worry about. Then plain uniform quantization just works.</p>

<p>One more wrinkle: weights are the easy part. <strong>Activations</strong> (the data flowing <em>through</em> the model as it runs) carry nasty dynamic outliers, which is why "4-bit weights" (W4A16) is routine but "4-bit weights <em>and</em> 4-bit activations" (W4A4) needs those rotation tricks to work at all.</p>

<div class="tldr">
  <span class="label">Weight compression TL;DR</span>
  <p style="margin:8px 0 0;">Two orthogonal levers, use both. MoE = fewer weights per token. Quantization = fewer bits per weight, where ~4.7 bits is the lossless floor and clever methods push below it. The payoff: a 30-billion-parameter MoE at 4-bit quality fits in ~16 GB of storage and streams only ~1.7 GB per token. Frontier-class quality, laptop-class memory.</p>
</div>

<h2 id="part5"><span class="part">Part 5</span>KV-Cache Compression: How to Afford a Million Words</h2>

<p>We've shrunk the system and the weights. The last giant is the KV cache — the model's growing notebook of the conversation. As we saw, it can balloon past the size of the model itself. This part is about taming it, and it's what makes million-token context windows possible.</p>

<h3>Why the cache is the real long-context problem</h3>

<p>Two things make the KV cache explode. <strong>It grows with batch size:</strong> each user has their own cache, so 100 users × 100,000 tokens each = ~1.5 TB of KV cache alone — eighteen H100s' worth of memory, before you've stored a single weight. You run out of memory long before you run out of math. And <strong>it grows with modality:</strong> text rarely needs a million tokens, but an hour of video, fed in frame by frame, can fill a million-token window all on its own. Audio and video are KV-cache firehoses.</p>

<p>And this directly sets your costs: KV size caps your batch size, which caps your throughput, which sets your price per token. Shrinking the KV cache pulls all four levers at once. There are essentially five knobs, and the first four <em>multiply</em> together.</p>

<h3>Knob 1: Shrink the per-token state</h3>

<p>The biggest structural win. The starting point, already standard in most models, is <strong>GQA</strong> (Grouped-Query Attention): instead of every attention head keeping its own K and V, groups of heads share them, cutting the cache ~4–8× for free.</p>

<p>The deeper move is <strong>MLA</strong> (Multi-head Latent Attention), introduced by DeepSeek. Instead of storing the full K and V vectors, it stores a small <em>compressed</em> summary (a "latent") and reconstructs what it needs on the fly. The result is dramatic: DeepSeek's huge model stores only ~70 KB per token — less than half of what our tiny 8B model needs with GQA, on a model ~80× larger. At that rate, a million tokens fits in ~70 GB, on a single node. Quality actually came out <em>better</em> than the traditional approach. The catch is that MLA has to be baked in during training — though researchers have since found ways to retrofit it onto already-trained models with a small amount of fine-tuning.</p>

<h3>Knob 2: Shrink the bits (quantize the cache)</h3>

<p>Same idea as weight quantization, applied to the cache. A method called <strong>KIVI</strong> noticed something neat: the keys and values misbehave in opposite ways, so they should be quantized along different axes (keys per-channel, values per-token). Done right, you get the KV cache down to 2 bits with almost no quality loss, roughly tripling throughput. An even more principled approach, <strong>TurboQuant</strong>, leans on information theory: it proves that naive coordinate-by-coordinate quantization wastes about 0.25 bits per number versus the theoretical optimum, then uses a random rotation (that Gaussian-dust trick again) to claw most of it back — with no calibration data needed.</p>

<h3>Knob 3: Read less (sparse attention)</h3>

<p>This knob attacks a different axis. Knobs 1 and 2 shrink what you <em>store</em>; sparse attention shrinks what you <em>read</em>. The insight: when generating a token, attention mass is mostly local (recent tokens) or concentrated on a few "hub" tokens. So you don't need to read the whole cache every step — just the relevant parts. The cache stays full-size on disk, but the per-token traffic collapses, which is what actually sets decode speed.</p>

<p>Approaches range from simple fixed patterns (only attend to a sliding window of recent tokens, à la Mistral; or mix mostly-local layers with occasional global ones, à la Gemma) to <em>learned</em> routing where a little gate decides which blocks of the past each query should read (NSA from DeepSeek, MoBA from Moonshot, DSA in DeepSeek's newer models). DSA's sparse reads <strong>halved</strong> the company's long-context API prices — a vivid reminder that algorithmic efficiency shows up directly on the invoice.</p>

<h3>Knob 4: Drop what you don't need (eviction)</h3>

<p>The bluntest knob: just throw tokens out of the cache. Methods like StreamingLLM, H2O, and SnapKV keep the important tokens (the first few "sink" tokens, the recent window, and a handful of heavy hitters) and evict the rest, often holding quality at a fraction of the cache size. One granularity up, <strong>compaction</strong> drops whole conversation turns — pause, summarize the old history, throw away the raw cache, resume. (If you've seen an AI coding assistant "compact" a long session, that's this.) It's fine for chat but risky for agents, since summarizing can quietly lose a detail that mattered.</p>

<h3>Knob 5: Get rid of the cache entirely</h3>

<p>The radical alternative. Knobs 1–4 shrink a cache that still grows with length. What if you used an architecture whose memory <em>doesn't grow at all?</em></p>

<p><strong>State Space Models</strong> (like Mamba-2) keep a fixed-size summary of everything seen so far — a constant few megabytes, no matter how long the context. Decode becomes constant-cost per step. The trade-off is recall: pure state-space models have fuzzy memory and struggle to fetch an exact detail from far back. The practical answer is <strong>hybrids</strong> — mostly cheap state-space layers with a few full-attention layers sprinkled in to handle precise retrieval. Several recent models (Qwen3-Next, IBM Granite 4, NVIDIA Nemotron-H, Jamba) are built this way, with ratios like 1 attention layer per 7–12 cheap ones.</p>

<h3>Putting it together: the million-token bill</h3>

<p>Because knobs 1–4 are on different axes, they stack. Watch a million-token cache shrink:</p>

<table>
  <tr><th>Step</th><th>Effect</th><th>KV size</th></tr>
  <tr><td>Plain GQA baseline (1M tokens)</td><td>—</td><td>147 GB</td></tr>
  <tr><td>+ MLA-style latent</td><td>÷8</td><td>18 GB</td></tr>
  <tr><td>+ 4-bit KV quantization</td><td>÷4</td><td>4.6 GB</td></tr>
  <tr><td>+ sparse reads</td><td>÷10 traffic</td><td>~0.5 GB read/token</td></tr>
</table>

<figure class="diagram">
<svg viewBox="0 0 700 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stacking KV compression tricks shrinks a 1M-token cache from 147 GB to under 5 GB">
  <text x="350" y="24" text-anchor="middle" class="dg-title">Shrinking a 1-million-token KV cache</text>
  <line x1="60" y1="240" x2="670" y2="240" stroke="#5c5c5c" stroke-width="1.5"/>
  <rect x="90" y="55" width="110" height="185" rx="4" fill="#c0392b"/>
  <text x="145" y="48" text-anchor="middle" class="dg-num" fill="#a83228">147 GB</text>
  <text x="145" y="258" text-anchor="middle" class="dg-small">GQA baseline</text>
  <rect x="245" y="105" width="110" height="135" rx="4" fill="#2b6cb0"/>
  <text x="300" y="98" text-anchor="middle" class="dg-num" fill="#2b6cb0">18 GB</text>
  <text x="300" y="258" text-anchor="middle" class="dg-small">+ MLA latent (÷8)</text>
  <rect x="400" y="145" width="110" height="95" rx="4" fill="#3a8a3a"/>
  <text x="455" y="138" text-anchor="middle" class="dg-num" fill="#2f6b2f">4.6 GB</text>
  <text x="455" y="258" text-anchor="middle" class="dg-small">+ 4-bit KV (÷4)</text>
  <rect x="555" y="200" width="110" height="40" rx="4" fill="#d98a1f"/>
  <text x="610" y="193" text-anchor="middle" class="dg-num" fill="#9c6b1f">~0.5 GB</text>
  <text x="610" y="258" text-anchor="middle" class="dg-small">+ sparse reads</text>
  <text x="610" y="274" text-anchor="middle" class="dg-small">(per-token traffic)</text>
</svg>
<figcaption>Because the tricks work on different axes, they multiply. Shrink the state, then its bits, then how much you read — and an impossible 147 GB collapses to a few gigabytes stored, with the per-token traffic that sets your speed dropping even further.</figcaption>
</figure>

<p>From "impossible on one GPU" to "a few gigabytes of storage, and the per-token traffic that sets your latency drops another order of magnitude." Stacked together, a million tokens of context becomes feasible on a single node.</p>

<div class="tldr">
  <span class="label">KV compression TL;DR</span>
  <p style="margin:8px 0 0;">Four orthogonal, multiplying knobs — shrink the state (MLA), shrink its bits (quantize), shrink the reads (sparse), drop what you never needed (evict) — plus a fifth radical option that replaces the growing cache with constant-size state (Mamba/hybrids). Turn them together and long context gets affordable.</p>
</div>

<h2 id="part6"><span class="part">Part 6</span>The Wrap-Up</h2>

<p>We've covered a lot of ground — from "what is a FLOP" to retrofitting low-rank attention onto trained models. Let's zoom back out, because the whole sprawling field collapses into one idea.</p>

<div class="callout">
  <span class="label">The meta-lesson</span>
  <p style="margin:8px 0 0;"><strong>Arithmetic intensity is destiny. Every single technique in this post moves fewer bytes per token.</strong> MoE moves fewer weights. Quantization moves fewer bits. Paging stops wasting KV memory. Prefix caching reads prompts once. MLA shrinks the cache 8×. Sparse attention reads a tenth of it. Disaggregation sends each phase to the hardware it wants. The chip does not care <em>how</em> you saved the bytes — through architecture, compression, or policy. Fewer bytes in means faster token out.</p>
</div>

<h3>Seven numbers worth remembering</h3>

<table>
  <tr><th>Number</th><th>What it means</th></tr>
  <tr><td>~1 PFLOP/s vs ~3.4 TB/s</td><td>An H100's math speed vs its memory speed — the source of all the trouble</td></tr>
  <tr><td>~300 FLOPs/byte</td><td>The "ridge point": operations you must do per byte fetched to keep the chip busy</td></tr>
  <tr><td>~4× compute, ~2× bandwidth per generation</td><td>Why the pressure keeps rising — math outruns memory</td></tr>
  <tr><td>~150 KB per token</td><td>KV cache for a small (8B) model, per conversation — the thing that grows</td></tr>
  <tr><td>~500× energy</td><td>One memory read vs one multiply — moving data is the whole cost</td></tr>
  <tr><td>0.1× price</td><td>What a cached token can cost vs an uncached one — prefix caching, as a discount</td></tr>
  <tr><td>~400× gap</td><td>Prefill vs decode speed on the same edge chip — the two phases are different worlds</td></tr>
</table>

<p>If you take away a single sentence, make it this one: <strong>a fast byte beats a fast FLOP — and moving fewer bytes beats buying more hardware.</strong></p>

<h3>Where to go deeper</h3>

<p>If this sparked your curiosity, the tutorial points to some excellent free next steps: the <em>"How to Scale Your Model"</em> guide from DeepMind for the roofline-to-parallelism story; Hugging Face's <em>Ultra-Scale Playbook</em> for training at cluster scale; Stanford's <em>CS336</em> course for building a language model from scratch; the <em>GPU MODE</em> lecture series for the CUDA-to-quantization pipeline; and Horace He's <em>"Making Deep Learning Go Brrrr"</em> for the compute-vs-bandwidth mental model that underpins this entire post.</p>

<p>And if you ever find yourself staring at a slow model wondering what to optimize, ask the question that every slide in this tour kept asking: <em>where is the chip stalling on memory — and how do I move fewer bytes?</em></p>

<p style="font-size:0.85em; color:#5c5c5c; border-top:1px solid #e2e2e2; padding-top:16px; margin-top:36px;">This post is an explanatory walk-through of the ideas in Alex Smola's "Efficiency in LLMs: Hardware, Serving, and Compression" tutorial, presented at the Columbia Machine Learning Summer School, 2026. All figures and example numbers are drawn from that tutorial, which notes they were verified as of June 2026 and will date quickly. Any errors in simplification are mine, not the original author's. Original slides: alex.smola.org/posts/45-mlss-efficiency.</p>

</div>

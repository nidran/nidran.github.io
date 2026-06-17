---
title: Blog
permalink: /blog/
layout: page
excerpt: Writing on machine learning, systems, and things I'm learning.
comments: false
---

<h3 class="posts-item-note" aria-label="Blog posts">Writing on machine learning, systems, and things I'm learning.</h3>
{%- for post in site.categories.blog -%}
<article class="post-item">
  <span class="post-item-date">{{ post.date | date: "%b %d, %Y" }}</span>
  <h4 class="post-item-title">
    <a href="{{ post.url }}">{{ post.title | escape }}</a>
  </h4>
</article>
{%- endfor -%}

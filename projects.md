---
title: Projects
permalink: /projects/
layout: page
comments: false
---

<center>A little list of some of the projects that I've done</center>


<!-- <h3 class="posts-item-note" aria-label="Recent Projects">Recent Projects</h3>
<center>
{%- for post in site.posts limit: site.number_of_posts -%}
<article class="post-item">
  <span class="post-item-date">{{ post.date | date: "%b %d, %Y" }}</span>
  <h4 class="post-item-title">
    <a href="{{ post.url }}">{{ post.title | escape }}</a>
  </h4>
</article>
{%- endfor -%}
</center> -->
<h3 class="posts-item-note" aria-label="Recent projects">Some of the prominent works that I have done.</h3>
{%- for post in site.categories.projects limit: site.number_of_posts -%}
<article class="post-item">
  <span class="post-item-date">{{ post.date | date: "%b %d, %Y" }}</span>
  <h4 class="post-item-title">
    <a href="{{ post.url }}">{{ post.title | escape }}</a>
  </h4>
</article>
{%- endfor -%}


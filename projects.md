---
title: Projects
permalink: /projects/
layout: page
comments: false
---

Hello! Hope you are having a good day! I am Nidhi, I am pursuing my master's at NYU Courant. When I'm not binge watching, I'm usually sleeping. Hit me up if you wana grab coffee nextdoors, discuss ML, and women rights!

<ul>
{% assign count = 1 %}
{% for post in site.posts %}
{% if post.categories contains "weekly miscellany" %}
{% if post.url != page.url and count < 6 %}
<li><a href="{{ post.url }}">{{ post.issue }}: {{ post.title }}</a></li>
{% assign count = count | plus: 1 %}
{% endif %}
{% endif %}
{% endfor %}
</ul>
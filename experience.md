---
title: Experience
permalink: /experience/
layout: page
comments: false
---

<center>My list of places that I had/am worked/working at</center>


<h3 class="posts-item-note" aria-label="Recent experiences"></h3>
{%- for work in site.categories.experiences -%}
<article class="post-item">
  <table cellspacing="0" cellpadding="0">
    <tr>
      <td style='width: 20%'>
        <span class="post-item-date">{{ work.position | escape }}</span>
      </td>
      <td>
        <h4 class="post-item-title">
          <a href="{{ work.url }}">{{ work.title | escape }}</a>
        </h4>
      </td>
      <td style='width: 30%'>
        <span class="post-item-date">{{ work.timeline | escape }}</span>
      </td>
    </tr>
  </table>
</article>
{%- endfor -%}
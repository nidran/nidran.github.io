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

<h3 class="posts-item-note" aria-label="Medium posts" style="margin-top:2.5em;">From Medium</h3>
<div id="medium-posts"><p class="post-item-date">Loading latest posts from Medium…</p></div>

<script>
(function () {
  var feed = "https://medium.com/feed/@nidran";
  var url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feed);
  var el = document.getElementById("medium-posts");

  function fmtDate(s) {
    var d = new Date(s);
    return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  }

  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.status !== "ok" || !data.items || !data.items.length) {
        el.innerHTML = '<p>See my writing on <a href="https://medium.com/@nidran" target="_blank" rel="noopener">Medium →</a></p>';
        return;
      }
      var html = "";
      data.items.forEach(function (item) {
        var reader = "/blog/read/?u=" + encodeURIComponent(item.link);
        html +=
          '<article class="post-item">' +
          '<span class="post-item-date">' + fmtDate(item.pubDate) + "</span>" +
          '<h4 class="post-item-title"><a href="' + reader + '">' + item.title + "</a></h4>" +
          "</article>";
      });
      el.innerHTML = html;
    })
    .catch(function () {
      el.innerHTML = '<p>Couldn\'t load Medium posts right now. See them on <a href="https://medium.com/@nidran" target="_blank" rel="noopener">Medium →</a></p>';
    });
})();
</script>

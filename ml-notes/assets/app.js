(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var store={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// theme + mobile nav
$('#theme').onclick=function(){var d=document.documentElement,cur=d.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=cur==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}};
$('#menu').onclick=function(){document.body.classList.toggle('nav')};
// progress
var read=store.get('read')||{};
function paintRead(){$$('#side a[data-slug]').forEach(function(a){a.classList.toggle('read',!!read[a.dataset.slug])})}
paintRead();
var art=$('article'),box=$('#done');
if(box&&art){var s=art.dataset.slug;box.checked=!!read[s];box.onchange=function(){if(box.checked)read[s]=1;else delete read[s];store.set('read',read);paintRead()}}
// sidebar: keep active in view
var act=$('#side a.active');if(act&&act.scrollIntoView)act.scrollIntoView({block:'center'});
// scroll bar + toc spy
var bar=$('#bar'),links=$$('#toc a'),hs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
function onScroll(){var h=document.documentElement,p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.width=(p*100)+'%';
var cur=-1;hs.forEach(function(e,i){if(e&&e.getBoundingClientRect().top<110)cur=i});links.forEach(function(a,i){a.classList.toggle('on',i===cur)})}
addEventListener('scroll',onScroll,{passive:true});onScroll();
// search
var idx=null,q=$('#q'),res=$('#results'),sel=-1;
function load(){if(idx)return Promise.resolve(idx);return fetch('assets/search-index.json').then(function(r){return r.json()}).then(function(j){idx=j;return j})}
function snippet(t,terms){var l=t.toLowerCase(),p=-1;for(var i=0;i<terms.length;i++){p=l.indexOf(terms[i]);if(p>-1)break}if(p<0)return t.slice(0,110);var a=Math.max(0,p-50);return(a?'…':'')+t.slice(a,a+140)+'…'}
function hl(s,terms){return terms.reduce(function(acc,t){return acc.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>')},s.replace(/</g,'&lt;'))}
function search(v){var terms=v.toLowerCase().split(/\s+/).filter(Boolean);if(!terms.length){res.hidden=true;return}
load().then(function(db){var out=[];db.forEach(function(d){var tl=d.title.toLowerCase(),hl_=d.heads.map(function(h){return h[1].toLowerCase()}),tx=d.text.toLowerCase(),sc=0,ok=true,hh=null;
terms.forEach(function(t){var s=0;if(tl.indexOf(t)>-1)s+=10;hl_.some(function(h,i){if(h.indexOf(t)>-1){s+=5;hh=hh||d.heads[i];return true}});var c=tx.split(t).length-1;if(c)s+=Math.min(c,5);if(!s)ok=false;sc+=s});
if(ok)out.push({d:d,sc:sc,hh:hh})});out.sort(function(a,b){return b.sc-a.sc});out=out.slice(0,8);sel=-1;
res.innerHTML=out.length?out.map(function(o){return '<a href="'+o.d.slug+'.html'+(o.hh?'#'+o.hh[0]:'')+'"><b>'+hl(o.d.title,terms)+'</b> <small>'+o.d.sec+(o.hh?' › '+hl(o.hh[1],terms):'')+'</small><small>'+hl(snippet(o.d.text,terms),terms)+'</small></a>'}).join(''):'<a>No matches</a>';res.hidden=false})}
q.addEventListener('input',function(){search(q.value)});
q.addEventListener('keydown',function(e){var as=$$('a[href]',res);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+as.length)%as.length;as.forEach(function(a,i){a.classList.toggle('sel',i===sel)})}
else if(e.key==='Enter'&&as.length){location.href=as[Math.max(sel,0)].href}else if(e.key==='Escape'){res.hidden=true;q.blur()}});
document.addEventListener('click',function(e){if(!res.contains(e.target)&&e.target!==q)res.hidden=true});
addEventListener('keydown',function(e){if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();q.focus()}});
})();

"""Phase 2C article-design previews (not public: docs/ is blocked by .htaccess; pages carry noindex).

Builds docs/previews/article-2c/{a,b,c}-{brief,news,compare,guide}.html from the REAL article files.
Inside <main> only two things change, the same two a generator would change in production:
  - the hero <img> points at the clean, text-free photo crop (data/home-images.json "#story") with a srcset;
  - nothing else: no text node inside <main> is added, removed or edited.
Outside <main>: the hand-written Read Next block is replaced by generated cards with clean crops,
the design's stylesheet is linked, and a small script stands in for fp.js additions (score bars, contents list).
Run:  python docs/previews/article-2c/build.py
"""
import json, re, html, os, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')) + '/'
OUT = ROOT + 'docs/previews/article-2c/'
CAT = json.load(open(ROOT + 'data/article-catalog.json', encoding='utf8'))['articles']
CROPS = json.load(open(ROOT + 'data/home-images.json', encoding='utf8'))
HP = json.load(open(ROOT + 'data/homepage.json', encoding='utf8'))['images']
BY_URL = {a['url']: a for a in CAT}

SAMPLES = {
    'brief':   '/reviews/2026-mahindra-thar-roxx-4x4-review/',
    'news':    '/news-yangwang-altior-reveal.html',
    'compare': '/comparisons/tata-sierra-ev-vs-mahindra-be-6/',
    'guide':   '/guides/5-star-bharat-ncap-cars-under-10-lakh/',
}
DESIGNS = {
    'a': ('Showroom', 'Petrol header band like the listing lead cards; clean photo straddles the band; body on ivory with card-style callouts and a petrol score panel.'),
    'b': ('Reading column', 'All ivory and quiet: centred header, rounded clean photo, contents list in the left margin on wide screens, score bars, compact Read Next rows.'),
    'c': ('Cinematic', 'Headline over a wide clean photo like the homepage lead story; photos, tables and the score panel break out to full width; Read Next on a petrol band.'),
}
LABEL = {'News': None, 'Reviews': "Buyer's Brief", 'Comparisons': 'Comparison', 'Buying Guides': 'Guide'}


def crop(url, kind):
    return CROPS.get(url.lstrip('/') + '#' + kind)


def src_file(url):
    p = url.lstrip('/')
    return ROOT + (p + 'index.html' if p.endswith('/') or not p else p)


def kicker(a):
    if a['category'] == 'News':
        return (a.get('subtype') or 'news').capitalize()
    if a.get('subtype') == 'explainer':
        return 'Explainer'
    return LABEL[a['category']]


def date(a):
    d = datetime.date.fromisoformat(a['published'][:10])
    return f'{d.day} {d.strftime("%b %Y")}'


def related(a, n=3):
    """same category first (newest first), then anything else with a clean crop; never itself"""
    pool = [x for x in CAT if x['url'] != a['url'] and crop(x['url'], 'thumb@16x9')]
    pool.sort(key=lambda x: x['published'], reverse=True)
    same = [x for x in pool if x['category'] == a['category']]
    return (same + [x for x in pool if x not in same])[:n]


def read_next(a):
    cards = []
    for r in related(a):
        c = crop(r['url'], 'thumb@16x9')
        cards.append(f'''      <article class="rn-card">
        <a class="rn-media" href="{r['url']}" tabindex="-1" aria-hidden="true"><img src="/{c['file']}" alt="" width="{c['w']}" height="{c['h']}" loading="lazy" decoding="async"></a>
        <div class="rn-body"><p class="rn-label">{html.escape(kicker(r))}</p><h3><a href="{r['url']}">{html.escape(r['title'])}</a></h3><p class="rn-date">{date(r)}</p></div>
      </article>''')
    return ('  <section class="rn" aria-labelledby="rnTitle"><div class="rn-wrap">\n    <h2 id="rnTitle">Read Next</h2>\n    <div class="rn-grid">\n'
            + '\n'.join(cards) + '\n    </div>\n  </div></section>\n\n')


ENHANCE = '''<script>
/* stands in for fp.js additions in production: nothing here edits article text */
(function(){
  var m=document.querySelector('main.content'); if(!m) return;
  /* score bars: read "8.5 / 10" from the score cell and expose it to CSS */
  m.querySelectorAll('.score-breakdown tr').forEach(function(tr){
    var td=tr.querySelector('td:last-child'); if(!td) return;
    var v=parseFloat(td.textContent); if(!isNaN(v)) { td.style.setProperty('--s', v/10); td.setAttribute('data-v', td.textContent.trim()); td.classList.add('has-bar'); }
  });
  /* contents list (design B): built from the article's own h2s */
  if(document.body.classList.contains('art-b')||document.body.classList.contains('art-a')){
    var hs=[].slice.call(m.querySelectorAll('h2')).filter(function(h){return !h.closest('.rn')});
    if(hs.length>=3){
      var nav=document.createElement('nav'); nav.className='toc'; nav.setAttribute('aria-label','On this page');
      var t=document.createElement('p'); t.className='toc-h'; t.textContent='On this page'; nav.appendChild(t);
      var ol=document.createElement('ol');
      hs.forEach(function(h,i){ if(!h.id) h.id='s'+(i+1); var li=document.createElement('li'), a=document.createElement('a'); a.setAttribute('href', location.pathname+'#'+h.id); a.textContent=h.textContent; li.appendChild(a); ol.appendChild(li); });
      nav.appendChild(ol); m.appendChild(nav);
      var links=nav.querySelectorAll('a');
      /* highlight the last heading scrolled past (above 30% of the screen) */
      var busy=false, mark=function(){ busy=false; var cur=-1, lim=innerHeight*.3;
        hs.forEach(function(h,i){ if(h.getBoundingClientRect().top<lim) cur=i; });
        links.forEach(function(l,i){ if(i===cur) l.setAttribute('aria-current','location'); else l.removeAttribute('aria-current'); }); };
      addEventListener('scroll', function(){ if(!busy){ busy=true; requestAnimationFrame(mark); } }, {passive:true}); mark();
    }
  }
})();
</script>
'''


def build(design, kind, url):
    a = BY_URL[url]
    s = open(src_file(url), encoding='utf8').read()
    base = url if url.endswith('/') else url.rsplit('/', 1)[0] + '/'
    # base for the article's relative links; noindex; design stylesheet
    s = s.replace('<head>', f'<head>\n  <base href="{base}">', 1)
    s = re.sub(r'<meta name="robots"[^>]*>', '<meta name="robots" content="noindex, nofollow">', s, count=1)
    s = re.sub(r'(<link rel="stylesheet" href="/assets/fp\.css[^"]*">)',
               rf'\1\n  <link rel="stylesheet" href="/docs/previews/article-2c/{design}.css?v=1">', s, count=1)
    s = re.sub(r'<body([^>]*)class="', rf'<body\1class="art-{design} art-{kind} ', s, count=1) if re.search(r'<body[^>]*class="', s) \
        else s.replace('<body', f'<body class="art-{design} art-{kind}"', 1)
    # hero: clean crop (production: generator), with srcset
    st, th = crop(url, 'story'), crop(url, 'thumb@16x9')
    if st:
        alt = (HP.get(url.lstrip('/'), {}).get('thumb', {}) or {}).get('alt')
        def hero(m):
            tag = m.group(0)
            tag = re.sub(r'src="[^"]*"', f'src="/{st["file"]}" srcset="/{th["file"]} {th["w"]}w, /{st["file"]} {st["w"]}w" sizes="(max-width: 1180px) 100vw, 1140px"', tag, count=1)
            tag = re.sub(r'width="\d+"', f'width="{st["w"]}"', tag, count=1)
            tag = re.sub(r'height="\d+"', f'height="{st["h"]}"', tag, count=1)
            if alt:
                tag = re.sub(r'alt="[^"]*"', f'alt="{html.escape(alt)}"', tag, count=1)
            return tag
        s = re.sub(r'<img class="hero-image"[^>]*>', hero, s, count=1)
    # Read Next: replace whatever sits between </main> and the footer
    i = s.index('</main>') + len('</main>')
    j = s.index('<footer class="site-footer')
    s = s[:i] + '\n\n' + read_next(a) + '  ' + s[j:]
    s = s.replace('</body>', ENHANCE + '</body>', 1)
    open(OUT + f'{design}-{kind}.html', 'w', encoding='utf8').write(s)


def main_text(path):
    s = open(path, encoding='utf8').read()
    m = re.search(r'<main[\s\S]*?</main>', s).group(0)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', m))).strip()


for d in DESIGNS:
    for k, u in SAMPLES.items():
        build(d, k, u)
        assert main_text(OUT + f'{d}-{k}.html') == main_text(src_file(u)), (d, k, 'main text changed')

rows = ''.join(f'<li><h2>{d.upper()} — {n}</h2><p>{t}</p><p>' + ' · '.join(f'<a href="/docs/previews/article-2c/{d}-{k}.html">{k}</a>' for k in SAMPLES) + '</p></li>'
               for d, (n, t) in DESIGNS.items())
open(OUT + 'index.html', 'w', encoding='utf8').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Article design previews (Phase 2C)</title>
<style>body{{font:16px/1.5 system-ui;max-width:760px;margin:40px auto;padding:0 16px;background:#F2EFE8;color:#11252E}}li{{margin:24px 0}}h2{{margin:0;font-size:20px}}a{{color:#9C473C}}</style></head>
<body><h1>Article design previews (Phase 2C)</h1><p>Real articles; text inside the article is unchanged in every preview (checked by the build). Pick one design: A, B or C.</p><ol>{rows}</ol></body></html>''')
print('built', len(DESIGNS) * len(SAMPLES), 'previews; article text unchanged in all')

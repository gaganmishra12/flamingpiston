"""
test-publishing.py — checks the publishing rules end to end on a throw-away copy of the site.

    python3 scripts/test-publishing.py

Copies the site to a temporary folder, adds fixture articles of every kind (news, Buyer's Brief, comparison, buying
guide, Car Culture), a draft, a story in review, a scheduled story and a pending revision of a published article,
rebuilds with scripts/update-site.sh at simulated dates (FP_BUILD_DATE), and checks the homepage, listing pages,
sitemap, RSS, search index and article catalogue. If Apache is installed (apache2 or httpd), it also serves the copy
with the real .htaccess and checks which URLs can be opened directly. The copy is deleted at the end; nothing touches
the real site. Needs node, python3 with Pillow and beautifulsoup4.
"""
import json, os, re, shutil, socket, subprocess, sys, tempfile, time, urllib.request, urllib.error
from bs4 import BeautifulSoup

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok))); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''))

tmp = tempfile.mkdtemp(prefix='fp-fixtures-'); os.chmod(tmp, 0o755)
W = os.path.join(tmp, 'site')
shutil.copytree(SITE, W, ignore=shutil.ignore_patterns('.git', '.git-orig', 'node_modules'))
P = lambda *a: os.path.join(W, *a)
rd = lambda f: open(P(f), encoding='utf-8').read()
def wr(f, s):
    os.makedirs(os.path.dirname(P(f)), exist_ok=True); open(P(f), 'w', encoding='utf-8').write(s)
jload = lambda f: json.loads(rd(f))
jsave = lambda f, d: wr(f, json.dumps(d, indent=1, ensure_ascii=False))

def build(date):
    r = subprocess.run(['sh', 'scripts/update-site.sh'], cwd=W, env=dict(os.environ, FP_BUILD_DATE=date), capture_output=True, text=True)
    if r.returncode: print(r.stdout[-3000:], r.stderr[-3000:]); sys.exit('build failed')
    return r.stdout + r.stderr

def home():
    s = BeautifulSoup(rd('index.html'), 'html.parser')
    lead = s.select_one('.hl h2 a')['href'].lstrip('/')
    panels = {p['id'][3:]: [a.select_one('h3 a')['href'].lstrip('/') for a in p.select('article')] for p in s.select('.ls-panel')}
    dates = {p['id'][3:]: [t['datetime'] for t in p.select('time')] for p in s.select('.ls-panel')}
    return lead, panels, dates

# ---- Apache (optional): serves the copy with its real .htaccess -----------------------------------------------
APACHE = shutil.which('apache2') or shutil.which('httpd')
MODS = next((d for d in ('/usr/lib/apache2/modules', '/usr/lib64/httpd/modules', '/usr/libexec/apache2') if os.path.isdir(d)), None)
apache = None
def apache_start():
    global apache
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    conf = os.path.join(tmp, 'httpd.conf')
    mods = ['mpm_event', 'authz_core', 'dir', 'mime', 'alias', 'rewrite']
    open(conf, 'w').write('\n'.join([f'ServerRoot {tmp}', 'ServerName localhost', f'Listen 127.0.0.1:{port}', f'PidFile {tmp}/httpd.pid',
        *[f'LoadModule {m}_module {MODS}/mod_{m}.so' for m in mods], 'TypesConfig /etc/mime.types', f'ErrorLog {tmp}/error.log',
        *(['User www-data', 'Group www-data'] if os.geteuid() == 0 else []),
        f'DocumentRoot {W}', '<Directory />', 'AllowOverride None', 'Require all denied', '</Directory>',
        f'<Directory {W}>', 'AllowOverride All', 'Require all granted', '</Directory>', 'DirectoryIndex index.html', '']))
    subprocess.run([APACHE, '-f', conf, '-k', 'start'], check=True); time.sleep(1)
    apache = (conf, f'http://127.0.0.1:{port}')
def apache_stop():
    if apache: subprocess.run([APACHE, '-f', apache[0], '-k', 'stop']); time.sleep(0.5)
def status(path):
    try: return urllib.request.urlopen(apache[1] + path).status
    except urllib.error.HTTPError as e: return e.code
def body(path):
    return urllib.request.urlopen(apache[1] + path).read().decode('utf-8', 'replace')

# ---- fixtures -------------------------------------------------------------------------------------------------
def clone(src, dst, title, published):
    h = rd(src)
    h = re.sub(r'<h1([^>]*)>[\s\S]*?</h1>', lambda m: f'<h1{m.group(1)}>{title}</h1>', h, count=1)
    h = re.sub(r'"datePublished":\s*"[^"]+"', f'"datePublished": "{published}"', h)
    h = re.sub(r'"dateModified":\s*"[^"]+"', f'"dateModified": "{published}"', h)
    old = src.replace('index.html', ''); new = dst.replace('index.html', '')
    wr(dst, h.replace(old, new))
KINDS = {   # kind: (template, fixture file, URL, publish time, Latest Stories tab, listing page)
    'news':    ('news-honda-november-2026-offers.html', 'news-fixture-news.html', 'news-fixture-news.html', '2026-11-27T09:00:00+05:30', 'news', 'news.html'),
    'brief':   ('reviews/2026-kia-seltos-review/index.html', 'reviews/fixture-brief/index.html', 'reviews/fixture-brief/', '2026-11-27T10:00:00+05:30', 'reviews', 'reviews.html'),
    'compare': ('comparisons/brezza-cng-vs-xuv-3xo-cng/index.html', 'comparisons/fixture-compare/index.html', 'comparisons/fixture-compare/', '2026-11-27T11:00:00+05:30', 'compare', 'comparisons.html'),
    'guide':   ('guides/festive-car-discounts-2026/index.html', 'guides/fixture-guide/index.html', 'guides/fixture-guide/', '2026-11-27T12:00:00+05:30', 'guides', 'guides.html'),
    'culture': ('news-aston-martin-valen.html', 'news-fixture-culture.html', 'news-fixture-culture.html', '2026-11-27T13:00:00+05:30', 'culture', 'car-culture.html'),
}
for k, (src, dst, url, when, tab, page) in KINDS.items():
    clone(src, dst, f'FIXTURE {k} story', when)
cc = jload('data/car-culture.json'); cc['urls'].append('news-fixture-culture.html'); jsave('data/car-culture.json', cc)
clone('news-honda-november-2026-offers.html', 'news-fixture-draft.html', 'FIXTURE draft', '2026-11-26T09:00:00+05:30')
clone('news-honda-november-2026-offers.html', 'news-fixture-review.html', 'FIXTURE in review', '2026-11-26T09:30:00+05:30')
clone('news-honda-november-2026-offers.html', 'news-fixture-future.html', 'FIXTURE scheduled', '2026-12-05T09:00:00+05:30')
clone('news-honda-november-2026-offers.html', 'news-fixture-p1.html', 'FIXTURE priority one launch', '2026-11-26T12:00:00+05:30')
clone('news-honda-november-2026-offers.html', 'news-fixture-chosen.html', 'FIXTURE chosen lead', '2026-11-01T09:00:00+05:30')
# pending revision of a published article: kept in drafts/ at the same path
REV = 'reviews/2026-kia-seltos-review/index.html'
approved = rd(REV)
wr('drafts/' + REV, re.sub(r'<h1([^>]*)>[\s\S]*?</h1>', lambda m: f'<h1{m.group(1)}>FIXTURE UNAPPROVED REVISION</h1>', approved, count=1))

out = build('2026-11-27T14:00:00+05:30')
reg = jload('data/articles.json')
fx = [u for u in reg['articles'] if 'fixture' in u]
check('new articles are registered automatically as Priority 3', len(fx) == 10 and all(reg['articles'][u]['priority'] == 3 for u in fx), f'{len(fx)} registered')
reg['articles']['news-fixture-draft.html']['status'] = 'draft'
reg['articles']['news-fixture-review.html']['status'] = 'review'
reg['articles']['news-fixture-p1.html']['priority'] = 1
jsave('data/articles.json', reg)
hp = jload('data/homepage.json')
thar = hp['banners']['reviews/2026-mahindra-thar-roxx-4x4-review/']
for u in ('news-fixture-p1.html', 'news-fixture-chosen.html'): hp['banners'][u] = dict(thar)   # reuse a real hero banner image
for k, v in KINDS.items(): hp['images'][v[2]] = hp['images']['news-honda-november-2026-offers.html']
hp['hero'].update(article='news-fixture-chosen.html', start='2026-11-27', end='2026-11-28')
jsave('data/homepage.json', hp)

# ---- build A: 27 Nov -----------------------------------------------------------------------------------------
out = build('2026-11-27T14:00:00+05:30')
lead, panels, dates = home()
for k, (src, dst, url, when, tab, page) in KINDS.items():
    listed = f'href="/{url}"' in rd(page)
    # the Car Culture fixture is a news page too, so it is (correctly) also the newest story on the News tab
    top = panels[tab][1] if k == 'news' else panels[tab][0]
    check(f'{k}: enters Latest Stories (newest of its "{tab}" tab) and {page}', top == url and listed, f'{tab}: {panels[tab][:2]}')
check('All tab = newest stories of every kind, newest first', panels['all'] == ['news-fixture-culture.html', 'guides/fixture-guide/', 'comparisons/fixture-compare/', 'reviews/fixture-brief/'], panels['all'])
check('every tab is newest first by original publish time', all(d == sorted(d, reverse=True) for d in dates.values()))
check('new articles are in the sitemap, RSS and search index', all(f'/{v[2]}' in rd(f) for v in KINDS.values() for f in ('sitemap.xml', 'search-index.json')) and all(f'/{v[2]}' in rd('feed.xml') for v in list(KINDS.values())[:5]))
check('chosen lead (hero.article inside start/end) leads, even an older news story', lead == 'news-fixture-chosen.html', lead)
check('routine Priority 3 stories never take the lead', lead not in [v[2] for v in KINDS.values()])
listing = rd('index.html') + rd('news.html') + rd('sitemap.xml') + rd('feed.xml') + rd('search-index.json')
for k in ('draft', 'review', 'future'):
    check(f'{k} story: not on the homepage, listings, sitemap, RSS or search', f'news-fixture-{k}.html' not in listing)
ht = rd('.htaccess')
check('.htaccess blocks the draft, in-review and scheduled URLs (generated block)', all(f'news\\-fixture\\-{k}\\.html' in ht for k in ('draft', 'review', 'future')))
check('pending revision: public page still the approved version', rd(REV) == approved)
check('pending revision: listings, sitemap and homepage keep the approved headline', 'FIXTURE UNAPPROVED REVISION' not in rd('reviews.html') + rd('index.html') + rd('sitemap.xml') + rd('search-index.json') + rd('feed.xml'))
cat = jload('data/article-catalog.json')
check('build reports the pending revision; catalogue flags it', 'revision of a published article' in out and any(a['url'] == '/reviews/2026-kia-seltos-review/' and a['revisionPending'] for a in cat['articles']))
rec = {a['url']: a for a in cat['articles']}
check('catalogue records category and placement for each new story', all(rec['/' + v[2]]['category'] == c for v, c in zip(KINDS.values(), ['News', 'Reviews', 'Comparisons', 'Buying Guides', 'News'])) and 'latest-stories' in rec['/news-fixture-culture.html']['homepage'])

if APACHE and MODS:
    apache_start()
    check('Apache: published article opens (200)', status('/reviews/fixture-brief/') == 200 and status('/news-fixture-news.html') == 200)
    check('Apache: draft returns 404 by direct URL', status('/news-fixture-draft.html') == 404)
    check('Apache: story in review returns 404 by direct URL', status('/news-fixture-review.html') == 404)
    check('Apache: scheduled story returns 404 before its time', status('/news-fixture-future.html') == 404)
    check('Apache: drafts/ folder (pending revision) returns 404', status('/drafts/' + REV) == 404 and status('/drafts/') == 404)
    check('Apache: public URL of the revised article serves the approved version', 'FIXTURE UNAPPROVED REVISION' not in body('/reviews/2026-kia-seltos-review/') and status('/reviews/2026-kia-seltos-review/') == 200)
    check('Apache: internal files stay blocked (data, docs, scripts)', status('/data/articles.json') == 404 and status('/docs/PUBLISHING.md') == 404 and status('/scripts/editorial.js') == 404)
    apache_stop()
else:
    check('Apache available for direct-URL tests', False, 'install apache2 to run these checks')

# ---- build B: 30 Nov, chosen lead expired -> newest Priority 1 with a hero banner (a news launch) ---------------
out = build('2026-11-30T09:00:00+05:30')
check('expired lead falls back automatically at the next rebuild (with a WARN)', 'outside its dates' in out and home()[0] == 'news-fixture-p1.html', home()[0])
check('a Priority 1 news story can lead (not only Buyer’s Briefs)', home()[0] == 'news-fixture-p1.html')

# ---- missing hero banner: a newer Priority 1 brief without a banner never displaces a valid lead ---------------
reg = jload('data/articles.json'); reg['articles']['reviews/fixture-brief/']['priority'] = 1; jsave('data/articles.json', reg)
out = build('2026-11-30T09:00:00+05:30')
check('missing hero banner: newer Priority 1 story without one does not lead; build names it', home()[0] == 'news-fixture-p1.html' and 'Lead story (Priority 1): reviews/fixture-brief/' in out)
hp = jload('data/homepage.json'); hp['hero'].update(article='reviews/fixture-brief/', start='', end=''); jsave('data/homepage.json', hp)
out = build('2026-11-30T09:00:00+05:30')
check('chosen lead without a hero banner is refused with a WARN; valid lead kept', 'has no "hero" banner' in out and home()[0] == 'news-fixture-p1.html')
reg = jload('data/articles.json'); reg['articles']['news-fixture-p1.html']['hero'] = False; jsave('data/articles.json', reg)
hp = jload('data/homepage.json'); hp['hero'].update(article=''); jsave('data/homepage.json', hp)
build('2026-11-30T09:00:00+05:30')
check('hero:false keeps a Priority 1 story out of the lead (back to the Thar Roxx brief)', home()[0] == 'reviews/2026-mahindra-thar-roxx-4x4-review/', home()[0])

# ---- scheduled story goes live after its time; approvals --------------------------------------------------------
build('2026-12-05T10:00:00+05:30')
check('scheduled story is listed after a rebuild past its publish time', 'news-fixture-future.html' in rd('news.html') and home()[1]['all'][0] == 'news-fixture-future.html')
check('...and its 404 rule is removed', 'news\\-fixture\\-future' not in rd('.htaccess'))
reg = jload('data/articles.json'); reg['articles']['news-fixture-review.html']['status'] = 'published'; jsave('data/articles.json', reg)
build('2026-12-05T10:00:00+05:30')
check('approving a story in review (status published) lists it and removes its 404 rule', 'news-fixture-review.html' in rd('news.html') and 'news\\-fixture\\-review' not in rd('.htaccess'))
shutil.copy(P('drafts/' + REV), P(REV)); os.remove(P('drafts/' + REV))
build('2026-12-05T10:00:00+05:30')
check('approving a revision (copy over the public file) updates listings at the next rebuild', 'FIXTURE UNAPPROVED REVISION' in rd('reviews.html'))
if APACHE and MODS:
    apache_start()
    check('Apache: scheduled story opens after the rebuild; draft still 404', status('/news-fixture-future.html') == 200 and status('/news-fixture-draft.html') == 404)
    apache_stop()

# ---- exclusions, edited articles, idempotency ---------------------------------------------------------------------
hp = jload('data/homepage.json'); hp['exclude']['urls'].append('news-fixture-future.html'); jsave('data/homepage.json', hp)
build('2026-12-05T10:00:00+05:30')
check('excluded story leaves the homepage but stays on its listing page and opens', 'news-fixture-future.html' not in rd('index.html') and 'news-fixture-future.html' in rd('news.html'))
before = home()[1]
wr('news-bmw-x1-lwb.html', re.sub(r'"dateModified":\s*"[^"]+"', '"dateModified": "2026-12-05T09:00:00+05:30"', rd('news-bmw-x1-lwb.html')))
build('2026-12-05T10:00:00+05:30')
check('editing an old article (new dateModified) does not move it up', home()[1] == before)
files = [os.path.join(r, f) for r, _, fs in os.walk(W) for f in fs]
snap = {f: open(f, 'rb').read() for f in files}
build('2026-12-05T10:00:00+05:30')
changed = [os.path.relpath(f, W) for f in files if os.path.exists(f) and open(f, 'rb').read() != snap[f]]
check('a second identical rebuild changes nothing (RSS and .htaccess included)', not changed, ', '.join(changed[:5]))

shutil.rmtree(tmp)
check('temporary fixture copy deleted', not os.path.exists(tmp))
fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)

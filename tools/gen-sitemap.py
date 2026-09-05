#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Genererar sitemap.xml med lastmod hamtad ur faktiskt andringsdatum per sida.

Kor fran repots rot:    python tools/gen-sitemap.py
Kontrollera utan att skriva:  python tools/gen-sitemap.py --check

Datumet tas i denna ordning:
  1. Har filen ocommittade andringar i arbetstradet -> dagens datum.
  2. Annars: datumet for den senaste commit som rorde just den filen (git log -1 --format=%cs).
  3. Faller det ocksa bort (t.ex. ny fil utanfor git) -> filens mtime.

Lagg till nya sidor i PAGES nedan. Rada aldrig lastmod for hand i sitemap.xml -
den filen skrivs over av det har skriptet.
"""
import os, subprocess, sys, datetime

BASE = 'https://aimstudios.se'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (URL-sokvag, kallfil relativt repots rot, priority)
PAGES = [
    ('/',                      'index.html',                  '1.0'),
    ('/webbdesign/',           'webbdesign/index.html',       '0.8'),
    ('/webboptimering/',       'webboptimering/index.html',   '0.8'),
    ('/seo/',                  'seo/index.html',              '0.8'),
    ('/ai-losningar/',         'ai-losningar/index.html',     '0.8'),
    ('/branding/',             'branding/index.html',         '0.8'),
    ('/case/',                 'case/index.html',             '0.6'),
    ('/om-oss/',               'om-oss/index.html',           '0.6'),
    ('/integritetspolicy.html','integritetspolicy.html',      '0.3'),
]

def git(args):
    try:
        out = subprocess.run(['git'] + args, cwd=ROOT, capture_output=True, text=True, timeout=30)
        return out.stdout.strip() if out.returncode == 0 else ''
    except Exception:
        return ''

def lastmod(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        sys.exit('SAKNAS: ' + rel)
    if git(['status', '--porcelain', '--', rel]):
        return datetime.date.today().isoformat(), 'andrad nu'
    d = git(['log', '-1', '--format=%cs', '--', rel])
    if d:
        return d, 'git'
    return datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat(), 'mtime'

def build():
    rows, report = [], []
    for url, rel, prio in PAGES:
        d, src = lastmod(rel)
        report.append((BASE + url, d, src))
        rows.append('  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n    <priority>%s</priority>\n  </url>'
                    % (BASE, url, d, prio))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(rows) + '\n</urlset>\n')
    return xml, report

if __name__ == '__main__':
    xml, report = build()
    check = '--check' in sys.argv
    out = os.path.join(ROOT, 'sitemap.xml')
    if not check:
        with open(out, 'w', encoding='utf-8', newline='\n') as f:
            f.write(xml)
    for loc, d, src in report:
        print('%-44s %s  (%s)' % (loc, d, src))
    print(('KONTROLL - inget skrevs' if check else 'Skrev ') + ('' if check else out))

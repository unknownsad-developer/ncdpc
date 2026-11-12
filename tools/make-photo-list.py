#!/usr/bin/env python3
"""Writes assets/js/photo-list.js: a copy of the photo file list that the website falls back to
when GitHub temporarily refuses to give it out (too many requests). Run from the repository folder:
    python3 tools/make-photo-list.py
The GitHub Action in .github/workflows/photo-list.yml runs this for you whenever photos change."""
import os, json
EXT = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif')
paths = []
for top in ('assets/photos', 'assets/slideshow'):
    for root, _dirs, files in os.walk(top):
        for f in files:
            if f.lower().endswith(EXT) and not f.startswith('.'):
                paths.append(os.path.join(root, f).replace(os.sep, '/'))
paths.sort()
with open('assets/js/photo-list.js', 'w', encoding='utf-8') as out:
    out.write('/* Automatic: a copy of the photo file list, used only if GitHub is too busy to give the live list.\n'
              '   Updated by tools/make-photo-list.py (run for you by the GitHub Action). Do not edit by hand. */\n')
    out.write('window.NCD_PHOTO_LIST = ' + json.dumps(paths, ensure_ascii=False, indent=0) + ';\n')
print(len(paths), 'photos listed')

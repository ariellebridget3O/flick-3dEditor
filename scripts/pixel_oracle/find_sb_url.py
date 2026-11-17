#!/usr/bin/env python3
"""Find the supabase createClient URL (REST base) near the auth.flick.art constant."""
import re
src = open('/home/z/my-project/flick-3dEditor/analysis/index-DBE17t4T.js', encoding='utf-8', errors='replace').read()

i = src.find('https://auth.flick.art')
print('=== around auth.flick.art ===')
print(repr(src[i-600:i+400]))
print()
# createClient calls
print('=== createClient calls ===')
for m in list(re.finditer(r'createClient\(', src))[:6]:
    print(repr(src[m.start()-120:m.end()+260]))
    print('---')

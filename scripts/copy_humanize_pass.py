"""
Comprehensive copy + humanization pass:
1. Delete "fully " filler (except "fully compliant")
2. Fix SilverLake → Jack Henry SilverLake
3. Fix right-of-offset phrasing
4. Standardize "customer" → cardholder/end user/member by context
5. Opener variety: break up "Brim enables BSB to use" formula
6. Drop "today" from "live in production today"
7. Agent banking role clarity where "partner FI" / "financial institution" is ambiguous
8. Vary client references — factual, no fabricated numbers
"""

import json
import re
import hashlib

with open("public/rfp_data.json", encoding="utf-8") as f:
    data = json.load(f)

updated_fields = 0

# ── 1. Delete "fully " filler ─────────────────────────────────────────────
# Keep: "fully compliant", "fully operational" (meaningful)
# Remove: "fully integrated", "fully white-labeled", "fully automated", etc.
FULLY_KEEP = re.compile(r'\bfully (compliant|operational|executed|funded)\b', re.IGNORECASE)

def remove_fully(text):
    # Only remove "fully " where it's pure filler (not before the keep-list words)
    result = []
    i = 0
    pattern = re.compile(r'\bfully ', re.IGNORECASE)
    for m in pattern.finditer(text):
        result.append(text[i:m.start()])
        rest = text[m.start():]
        if FULLY_KEEP.match(rest):
            result.append(m.group())  # keep it
        # else: skip "fully " (drop it)
        i = m.end()
    result.append(text[i:])
    return "".join(result)

# ── 2. SilverLake → Jack Henry (consistent full name on first use per field) ─
def fix_silverlake(text):
    # "SilverLake" alone → "Jack Henry SilverLake"
    text = re.sub(r'\bSilverLake\b(?! is | core )', 'Jack Henry SilverLake', text)
    # Avoid double "Jack Henry Jack Henry SilverLake"
    text = text.replace("Jack Henry Jack Henry SilverLake", "Jack Henry SilverLake")
    return text

# ── 3. Right-of-offset ────────────────────────────────────────────────────
def fix_right_of_offset(text):
    text = text.replace(
        "Brim gives BSB the right-of-offset workflow",
        "Brim enables the right-of-offset workflow for BSB"
    )
    return text

# ── 4. "customer" context-aware replacement ──────────────────────────────
# In a card program: cardholder = end consumer with the card
# end user = digital/portal/app context
# member = credit union context
# BSB is "the client", "the issuing bank", "BSB" — not "customer"
# Keep "customer service", "customer relationship manager", etc. as-is

CUSTOMER_CARDHOLDER = [
    # Cardholder contexts — the person who has/uses the card
    (r'\bcustomer notification\b', 'cardholder notification'),
    (r'\bcustomer communications?\b', 'cardholder communications'),
    (r'\bcustomer statement\b', 'cardholder statement'),
    (r'\bcustomer data\b', 'cardholder data'),
    (r'\bcustomer account\b', 'cardholder account'),
    (r'\bcustomer opt-out\b', 'cardholder opt-out'),
    (r'\bcustomer opt out\b', 'cardholder opt out'),
    (r'\bcustomer complaint\b', 'cardholder complaint'),
    (r'\bcustomer dispute\b', 'cardholder dispute'),
    (r'\bcustomer activation\b', 'cardholder activation'),
    (r'\bcustomer onboarding\b', 'cardholder onboarding'),
    (r'\bcustomer behavior\b', 'cardholder behavior'),
    (r'\bcustomer satisfaction\b', 'cardholder satisfaction'),
    (r'\bcustomer confusion\b', 'cardholder confusion'),
    (r'\bcustomer consent\b', 'cardholder consent'),
    (r'\bcustomer credit\b', 'cardholder credit'),
    (r'\bcustomer balance\b', 'cardholder balance'),
    (r'\bcustomer payment\b', 'cardholder payment'),
    (r'\bcustomer transaction\b', 'cardholder transaction'),
    (r'\bcustomer identity\b', 'cardholder identity'),
    (r'\bcustomer information\b', 'cardholder information'),
    (r'\bcustomer record\b', 'cardholder record'),
    (r'\bcustomer profile\b', 'cardholder profile'),
    (r'\bcustomer preference\b', 'cardholder preference'),
    (r'\bcustomer eligibility\b', 'cardholder eligibility'),
    (r'\bcustomer verification\b', 'cardholder verification'),
    (r'\bcustomer authentication\b', 'cardholder authentication'),
    (r'\bcustomer can \b', 'the cardholder can '),
    (r'\bcustomer receives\b', 'the cardholder receives'),
    (r'\bcustomer sees\b', 'the cardholder sees'),
    (r'\bcustomer chooses\b', 'the cardholder chooses'),
    (r'\bcustomer enters\b', 'the cardholder enters'),
    (r'\bcustomer submits\b', 'the cardholder submits'),
    (r'\bcustomer completes\b', 'the cardholder completes'),
    (r'\bcustomer initiates\b', 'the cardholder initiates'),
    (r'\bcustomer requests\b', 'the cardholder requests'),
    (r'\bcustomer confirms\b', 'the cardholder confirms'),
    (r'\bcustomer selects\b', 'the cardholder selects'),
    (r'\bcustomer accesses\b', 'the cardholder accesses'),
    (r'\bcustomer views\b', 'the cardholder views'),
    (r'\bcustomer\b\'s', 'the cardholder\'s'),
    (r'\bthe customer\'s\b', 'the cardholder\'s'),
    (r'\ba customer\b', 'a cardholder'),
    (r'\bthe customer\b', 'the cardholder'),
    (r'\beach customer\b', 'each cardholder'),
    (r'\bnew customers\b', 'new cardholders'),
    (r'\bexisting customers\b', 'existing cardholders'),
    (r'\bindividual customers\b', 'individual cardholders'),
]

# End-user contexts: portal, app, digital self-service
CUSTOMER_ENDUSER = [
    (r'\bcustomer[- ]facing portal\b', 'cardholder portal'),
    (r'\bcustomer portal\b', 'cardholder portal'),
    (r'\bcustomer app\b', 'cardholder app'),
    (r'\bcustomer mobile app\b', 'cardholder mobile app'),
    (r'\bcustomer-facing\b', 'cardholder-facing'),
    (r'\bcustomer interface\b', 'cardholder interface'),
    (r'\bcustomer journey\b', 'cardholder journey'),
    (r'\bcustomer experience\b', 'cardholder experience'),
    (r'\bcustomer interaction\b', 'cardholder interaction'),
    (r'\bcustomer engagement\b', 'cardholder engagement'),
    (r'\bcustomer lifecycle\b', 'cardholder lifecycle'),
    (r'\bcustomer touch\b', 'cardholder touch'),
]

def apply_customer_fixes(text):
    for pattern, replacement in CUSTOMER_CARDHOLDER + CUSTOMER_ENDUSER:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

# ── 5. Opener variety: "Brim enables BSB to use X" ────────────────────────
# Rotate through 5 opener styles based on a stable hash of the sentence
# so it's deterministic (same question always gets same opener)

OPENER_TEMPLATES = [
    # (match pattern, replacement)
    lambda noun: f"Brim gives BSB {noun}",
    lambda noun: f"BSB gains {noun} through Brim",
    lambda noun: f"The platform gives BSB {noun}",
    lambda noun: f"Brim built {noun} for BSB",
    lambda noun: f"BSB gets {noun}",
]

def vary_opener(text, ref):
    """
    Replace sentence-opening 'Brim enables BSB to use X [rest]'
    with a varied alternative, rotating by ref hash.
    Only targets the FIRST occurrence in the field (opener).
    """
    pattern = re.compile(
        r'^(Brim enables BSB to use )(a |an |the |full |)([\w\-]+(?:\s+[\w\-]+){0,6})',
        re.IGNORECASE | re.MULTILINE
    )
    # Use ref hash to pick template deterministically
    idx = int(hashlib.md5(ref.encode()).hexdigest(), 16) % len(OPENER_TEMPLATES)
    template = OPENER_TEMPLATES[idx]

    def replacer(m):
        article = m.group(2)
        noun = m.group(3)
        new_start = template(f"{article}{noun}".strip())
        return new_start

    # Only replace the very first match (opener)
    return pattern.sub(replacer, text, count=1)

# ── 6. "live in production today" → "live in production" ─────────────────
def drop_today(text):
    text = re.sub(r'\blive in production today\b', 'live in production', text, flags=re.IGNORECASE)
    text = re.sub(r'\bin production today\b', 'in production', text, flags=re.IGNORECASE)
    return text

# ── 7. Agent banking role language ────────────────────────────────────────
# "financial institution" → "partner FI" in the context of BSB's network
# "partner bank" → "partner FI" (more precise)
AGENT_BANKING = [
    (r'\bfinancial institution\b(?! partner|\s+of record)', 'partner FI'),
    (r'\bpartner bank\b', 'partner FI'),
    (r'\bagent banking partner\b', 'agent bank partner'),
    # Vary "partner FI" occasionally with "agent bank partner" or "client FI"
    # (handled below by rotation)
]

def apply_agent_banking(text):
    for pattern, replacement in AGENT_BANKING:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

# ── 8. Client reference cleanup ───────────────────────────────────────────
# "live across multiple financial institutions, fintechs..." → keep name drops, drop vague "multiple"
CLIENT_FIXES = [
    (
        r'live across multiple financial institutions, fintechs, airlines, and merchants in production',
        'live in production across banks, credit unions, fintechs, and loyalty programs — including Affinity Credit Union, Manulife, Laurentian Bank, and CWB'
    ),
    (
        r'live across multiple financial institutions',
        'live across partner FIs including Affinity Credit Union, Manulife, and Laurentian Bank'
    ),
    (
        r'across regulated banks, credit unions, fintechs, and global brands',
        'across regulated banks, credit unions, and fintechs — including Affinity Credit Union, Manulife Bank, and Laurentian Bank'
    ),
]

def apply_client_fixes(text):
    for old, new in CLIENT_FIXES:
        text = text.replace(old, new)
    return text

# ── Apply all transforms ───────────────────────────────────────────────────
for q in data["questions"]:
    ref = q.get("ref", "")
    for field in ["paragraph", "bullet"]:
        text = q.get(field, "")
        if not text:
            continue
        original = text

        text = remove_fully(text)
        text = fix_silverlake(text)
        text = fix_right_of_offset(text)
        text = apply_customer_fixes(text)
        text = drop_today(text)
        text = apply_agent_banking(text)
        text = apply_client_fixes(text)
        # Opener variety only on paragraphs (bullets are already varied)
        if field == "paragraph":
            text = vary_opener(text, ref)

        if text != original:
            q[field] = text
            updated_fields += 1

print(f"Fields updated: {updated_fields}")

# ── Spot-check counts after ────────────────────────────────────────────────
def count_pat(pat, flags=0):
    total = 0
    for q in data["questions"]:
        for field in ["paragraph", "bullet"]:
            text = q.get(field, "") or ""
            total += len(re.findall(pat, text, flags))
    return total

print(f"\nAFTER:")
print(f"  'fully ' remaining:      {count_pat(r'fully ', re.IGNORECASE)}")
p_sl = r'\bSilverLake\b'
print(f"  'SilverLake' remaining:  {count_pat(p_sl)}")
print(f"  'Brim enables BSB to use': {count_pat(r'Brim enables BSB to use')}")
print(f"  'live in production today': {count_pat(r'live in production today', re.IGNORECASE)}")
p_cust = r'\bcustomer\b'
p_ch = r'\bcardholder\b'
print(f"  'customer' remaining:    {count_pat(p_cust, re.IGNORECASE)}")
print(f"  'cardholder' count:      {count_pat(p_ch, re.IGNORECASE)}")

# Save
with open("public/rfp_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Verify JSON
with open("public/rfp_data.json", encoding="utf-8") as f:
    json.load(f)
print("\nJSON valid ✓")

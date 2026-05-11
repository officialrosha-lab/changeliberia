# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: donations.spec.ts >> Donations & Stripe Integration >> should display donation amount in checkout
- Location: tests/e2e/donations.spec.ts:114:7

# Error details

```
Error: locator.textContent: Unexpected token "|" while parsing css selector "[data-testid="donation-amount"]|[data-testid="total-amount"]". Did you mean to CSS.escape it?
Call log:
  - waiting for [data-testid="donation-amount"]|[data-testid="total-amount"]

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - generic [ref=e14]:
      - generic [ref=e16]: Trending
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,241 signatures" [ref=e21] [cursor=pointer]:
              - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e22]: — 1,241 signatures
            - generic [ref=e23]: ·
          - generic [ref=e24]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e25] [cursor=pointer]:
              - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e26]: — 1,240 signatures
            - generic [ref=e27]: ·
          - generic [ref=e28]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e29] [cursor=pointer]:
              - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e30]: — 1,240 signatures
            - generic [ref=e31]: ·
          - generic [ref=e32]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e33] [cursor=pointer]:
              - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e34]: — 1,240 signatures
            - generic [ref=e35]: ·
          - generic [ref=e36]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e37] [cursor=pointer]:
              - /url: /petitions/cmp0dilc50002bqpe4andpdu3
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e38]: — 1,240 signatures
            - generic [ref=e39]: ·
          - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e41] [cursor=pointer]:
            - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
            - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
            - generic [ref=e42]: — 1,240 signatures
          - generic [ref=e43]: ·
        - generic [ref=e44]:
          - generic [ref=e45]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,241 signatures" [ref=e46] [cursor=pointer]:
              - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e47]: — 1,241 signatures
            - generic [ref=e48]: ·
          - generic [ref=e49]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e50] [cursor=pointer]:
              - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e51]: — 1,240 signatures
            - generic [ref=e52]: ·
          - generic [ref=e53]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e54] [cursor=pointer]:
              - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e55]: — 1,240 signatures
            - generic [ref=e56]: ·
          - generic [ref=e57]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e58] [cursor=pointer]:
              - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e59]: — 1,240 signatures
            - generic [ref=e60]: ·
          - generic [ref=e61]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e62] [cursor=pointer]:
              - /url: /petitions/cmp0dilc50002bqpe4andpdu3
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e63]: — 1,240 signatures
            - generic [ref=e64]: ·
          - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e66] [cursor=pointer]:
            - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
            - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
            - generic [ref=e67]: — 1,240 signatures
          - generic [ref=e68]: ·
    - banner [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e71]:
          - link "Change Liberia" [ref=e72] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e73]
          - navigation [ref=e74]:
            - link "Search" [ref=e75] [cursor=pointer]:
              - /url: /petitions
              - generic [ref=e76]: 🔍
              - generic [ref=e77]: Search
            - link "Donate" [ref=e78] [cursor=pointer]:
              - /url: /#donate
        - generic [ref=e79]:
          - link "Start a petition" [ref=e80] [cursor=pointer]:
            - /url: /create
          - button "+ Join 🇱🇷 0" [ref=e81]:
            - generic [ref=e82]: + Join 🇱🇷
            - generic [ref=e83]: "0"
          - button "Switch to dark mode" [ref=e84]:
            - img [ref=e85]
          - generic [ref=e87]:
            - link "Sign up" [ref=e88] [cursor=pointer]:
              - /url: /auth/signup
            - link "Log in" [ref=e89] [cursor=pointer]:
              - /url: /auth/login
  - main [ref=e90]:
    - generic [ref=e91]:
      - generic:
        - img
      - generic [ref=e92]:
        - generic [ref=e93]:
          - img
          - generic [ref=e95]:
            - generic [ref=e96]: 🇱🇷 Liberia's civic petition platform
            - heading "Change Liberia starts with you." [level=1] [ref=e97]:
              - text: Change Liberia
              - text: starts with you.
            - paragraph [ref=e98]: Join thousands of Liberians raising real issues — from roads in Sinkor to schools in Lofa. Gather verified support and move leaders to act.
            - generic [ref=e99]: 10,247 signatures today
            - generic [ref=e100]:
              - button "Start a petition" [ref=e101] [cursor=pointer]
              - link "Browse causes →" [ref=e102] [cursor=pointer]:
                - /url: /petitions
        - generic [ref=e103]:
          - img
          - generic [ref=e108]:
            - generic [ref=e109]:
              - heading "What change does Liberia need?" [level=2] [ref=e110]
              - paragraph [ref=e111]: Start by sharing the issue you care about. We'll guide you through the rest.
            - generic [ref=e112]:
              - generic [ref=e113]:
                - textbox "Type something..." [ref=e114]
                - generic:
                  - generic:
                    - generic: Fix the
              - paragraph [ref=e116]: 0 / 120 characters
            - button "Create petition" [disabled] [ref=e117]
            - paragraph [ref=e118]: Your petition will be reviewed before going live. It's free and takes less than 5 minutes.
    - generic [ref=e121]:
      - generic [ref=e122]:
        - generic [ref=e123]:
          - paragraph [ref=e124]: 21+
          - paragraph [ref=e125]: Petitions created
        - generic [ref=e126]:
          - paragraph [ref=e127]: 26K+
          - paragraph [ref=e128]: Verified signatures
        - generic [ref=e129]:
          - paragraph [ref=e130]: "0"
          - paragraph [ref=e131]: Campaigns won
        - generic [ref=e132]:
          - paragraph [ref=e133]: "15"
          - paragraph [ref=e134]: Counties reached
      - paragraph [ref=e135]: Join Liberians using verified petitions to speak up for schools, roads, health, and justice — county by county.
    - generic [ref=e138]:
      - paragraph [ref=e139]: 🔥 Trending campaign
      - generic [ref=e143]:
        - generic [ref=e144]:
          - generic [ref=e145]: 🟢 Active
          - generic [ref=e146]: ✎ 1,241 signatures
        - heading "Fix Sinkor Community Roads Before Rainy Season" [level=2] [ref=e147]
        - paragraph [ref=e148]: Thousands cannot safely commute when rains begin.
        - generic [ref=e149]:
          - link "Sign this petition" [ref=e150] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v#sign
          - link "Read full story →" [ref=e151] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
    - generic [ref=e154]:
      - generic [ref=e155]:
        - paragraph [ref=e156]: How it works
        - heading "Civic action for Liberia, made simple" [level=2] [ref=e157]
        - paragraph [ref=e158]: Change Liberia is a structured civic process — from a citizen raising an issue to a government authority formally receiving and responding to it.
      - generic [ref=e159]:
        - generic [ref=e161]:
          - generic [ref=e162]:
            - generic [ref=e163]: ✍️
            - generic [ref=e164]: "1"
          - heading "Submit your issue" [level=3] [ref=e166]
          - paragraph [ref=e167]: Describe what needs to change. Choose categories, add prior actions taken, and set your signature goal. Takes under 3 minutes.
        - generic [ref=e169]:
          - generic [ref=e170]:
            - generic [ref=e171]: 🔎
            - generic [ref=e172]: "2"
          - heading "Petition is reviewed" [level=3] [ref=e174]
          - paragraph [ref=e175]: Our team reviews every petition within 24–48 hours to confirm it is a genuine civic issue. Legitimate grievances are never suppressed.
        - generic [ref=e177]:
          - generic [ref=e178]:
            - generic [ref=e179]: 🤝
            - generic [ref=e180]: "3"
          - heading "People sign & support" [level=3] [ref=e182]
          - paragraph [ref=e183]: Share your petition. Verified Liberian signatures carry far more weight with decision-makers than unverified ones.
        - generic [ref=e185]:
          - generic [ref=e186]:
            - generic [ref=e187]: 📊
            - generic [ref=e188]: "4"
          - heading "Threshold reached" [level=3] [ref=e190]
          - paragraph [ref=e191]: At 1,000 verified signatures a formal PDF report is generated, ready for official submission to the right authority.
        - generic [ref=e193]:
          - generic [ref=e194]:
            - generic [ref=e195]: 📬
            - generic [ref=e196]: "5"
          - heading "Delivered to authority" [level=3] [ref=e198]
          - paragraph [ref=e199]: Smart routing identifies the correct Ministry, Legislature, or County official and delivers the petition formally with a digital record.
        - generic [ref=e201]:
          - generic [ref=e202]:
            - generic [ref=e203]: 📣
            - generic [ref=e204]: "6"
          - heading "Response tracked publicly" [level=3] [ref=e205]
          - paragraph [ref=e206]: The official response — or silence — is tracked and shown publicly on the petition page. No response is also a public fact.
      - generic [ref=e207]:
        - link "Start a petition — it's free" [ref=e208] [cursor=pointer]:
          - /url: /create
        - link "Full process details →" [ref=e209] [cursor=pointer]:
          - /url: /how-it-works
    - generic [ref=e212]:
      - generic [ref=e213]:
        - paragraph [ref=e214]: Active campaigns
        - heading "Discover causes" [level=2] [ref=e215]
        - paragraph [ref=e216]: Petitions gaining momentum across Liberia
        - generic [ref=e219]:
          - generic [ref=e220]:
            - textbox "Search petitions by title, topic, or cause..." [ref=e221]
            - img
          - button "Search" [ref=e222]
          - button "Advanced filters" [ref=e223]:
            - img [ref=e224]
      - generic [ref=e226]:
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,241 signatures Growing today" [ref=e227] [cursor=pointer]:
          - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e229]
          - generic [ref=e230]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e231]
            - paragraph [ref=e232]: Thousands cannot safely commute when rains begin.
            - generic [ref=e233]:
              - generic [ref=e234]: 1,241
              - generic [ref=e235]: signatures
              - generic [ref=e236]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e237] [cursor=pointer]:
          - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e239]
          - generic [ref=e240]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e241]
            - paragraph [ref=e242]: Thousands cannot safely commute when rains begin.
            - generic [ref=e243]:
              - generic [ref=e244]: 1,240
              - generic [ref=e245]: signatures
              - generic [ref=e246]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e247] [cursor=pointer]:
          - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e249]
          - generic [ref=e250]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e251]
            - paragraph [ref=e252]: Thousands cannot safely commute when rains begin.
            - generic [ref=e253]:
              - generic [ref=e254]: 1,240
              - generic [ref=e255]: signatures
              - generic [ref=e256]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e257] [cursor=pointer]:
          - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e259]
          - generic [ref=e260]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e261]
            - paragraph [ref=e262]: Thousands cannot safely commute when rains begin.
            - generic [ref=e263]:
              - generic [ref=e264]: 1,240
              - generic [ref=e265]: signatures
              - generic [ref=e266]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e267] [cursor=pointer]:
          - /url: /petitions/cmp0dilc50002bqpe4andpdu3
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e269]
          - generic [ref=e270]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e271]
            - paragraph [ref=e272]: Thousands cannot safely commute when rains begin.
            - generic [ref=e273]:
              - generic [ref=e274]: 1,240
              - generic [ref=e275]: signatures
              - generic [ref=e276]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e277] [cursor=pointer]:
          - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e279]
          - generic [ref=e280]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e281]
            - paragraph [ref=e282]: Thousands cannot safely commute when rains begin.
            - generic [ref=e283]:
              - generic [ref=e284]: 1,240
              - generic [ref=e285]: signatures
              - generic [ref=e286]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e287] [cursor=pointer]:
          - /url: /petitions/cmp0cqep50002b6vl4uyfawu8
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e289]
          - generic [ref=e290]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e291]
            - paragraph [ref=e292]: Thousands cannot safely commute when rains begin.
            - generic [ref=e293]:
              - generic [ref=e294]: 1,240
              - generic [ref=e295]: signatures
              - generic [ref=e296]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e297] [cursor=pointer]:
          - /url: /petitions/cmp0cnrf10002rtwfunt5grt1
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e299]
          - generic [ref=e300]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e301]
            - paragraph [ref=e302]: Thousands cannot safely commute when rains begin.
            - generic [ref=e303]:
              - generic [ref=e304]: 1,240
              - generic [ref=e305]: signatures
              - generic [ref=e306]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e307] [cursor=pointer]:
          - /url: /petitions/cmp0clods00024vl2kxmjlsll
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e309]
          - generic [ref=e310]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e311]
            - paragraph [ref=e312]: Thousands cannot safely commute when rains begin.
            - generic [ref=e313]:
              - generic [ref=e314]: 1,240
              - generic [ref=e315]: signatures
              - generic [ref=e316]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e317] [cursor=pointer]:
          - /url: /petitions/cmp0cjzuk0002haeic0apg05b
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e319]
          - generic [ref=e320]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e321]
            - paragraph [ref=e322]: Thousands cannot safely commute when rains begin.
            - generic [ref=e323]:
              - generic [ref=e324]: 1,240
              - generic [ref=e325]: signatures
              - generic [ref=e326]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e327] [cursor=pointer]:
          - /url: /petitions/cmp0cg81f000214kdymrcnlvz
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e329]
          - generic [ref=e330]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e331]
            - paragraph [ref=e332]: Thousands cannot safely commute when rains begin.
            - generic [ref=e333]:
              - generic [ref=e334]: 1,240
              - generic [ref=e335]: signatures
              - generic [ref=e336]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e337] [cursor=pointer]:
          - /url: /petitions/cmp0cdu1a000242m924n644t5
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e339]
          - generic [ref=e340]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e341]
            - paragraph [ref=e342]: Thousands cannot safely commute when rains begin.
            - generic [ref=e343]:
              - generic [ref=e344]: 1,240
              - generic [ref=e345]: signatures
              - generic [ref=e346]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e347] [cursor=pointer]:
          - /url: /petitions/cmp0cbjcl0002mffb1bsbeive
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e349]
          - generic [ref=e350]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e351]
            - paragraph [ref=e352]: Thousands cannot safely commute when rains begin.
            - generic [ref=e353]:
              - generic [ref=e354]: 1,240
              - generic [ref=e355]: signatures
              - generic [ref=e356]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e357] [cursor=pointer]:
          - /url: /petitions/cmp0c9ley0002ioilqrw20i95
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e359]
          - generic [ref=e360]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e361]
            - paragraph [ref=e362]: Thousands cannot safely commute when rains begin.
            - generic [ref=e363]:
              - generic [ref=e364]: 1,240
              - generic [ref=e365]: signatures
              - generic [ref=e366]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e367] [cursor=pointer]:
          - /url: /petitions/cmp0c8sru0002cip519liwsm0
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e369]
          - generic [ref=e370]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e371]
            - paragraph [ref=e372]: Thousands cannot safely commute when rains begin.
            - generic [ref=e373]:
              - generic [ref=e374]: 1,240
              - generic [ref=e375]: signatures
              - generic [ref=e376]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e377] [cursor=pointer]:
          - /url: /petitions/cmp0c0ft400029cec7qqmmuez
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e379]
          - generic [ref=e380]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e381]
            - paragraph [ref=e382]: Thousands cannot safely commute when rains begin.
            - generic [ref=e383]:
              - generic [ref=e384]: 1,240
              - generic [ref=e385]: signatures
              - generic [ref=e386]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e387] [cursor=pointer]:
          - /url: /petitions/cmp0byar40002pjgluym81ijm
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e389]
          - generic [ref=e390]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e391]
            - paragraph [ref=e392]: Thousands cannot safely commute when rains begin.
            - generic [ref=e393]:
              - generic [ref=e394]: 1,240
              - generic [ref=e395]: signatures
              - generic [ref=e396]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e397] [cursor=pointer]:
          - /url: /petitions/cmp0blaf20002rzaa86g4lf07
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e399]
          - generic [ref=e400]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e401]
            - paragraph [ref=e402]: Thousands cannot safely commute when rains begin.
            - generic [ref=e403]:
              - generic [ref=e404]: 1,240
              - generic [ref=e405]: signatures
              - generic [ref=e406]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e407] [cursor=pointer]:
          - /url: /petitions/cmp0b5n8n000217o87ajqu66o
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e409]
          - generic [ref=e410]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e411]
            - paragraph [ref=e412]: Thousands cannot safely commute when rains begin.
            - generic [ref=e413]:
              - generic [ref=e414]: 1,240
              - generic [ref=e415]: signatures
              - generic [ref=e416]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e417] [cursor=pointer]:
          - /url: /petitions/cmp054xje00021zshki4laxca
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e419]
          - generic [ref=e420]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e421]
            - paragraph [ref=e422]: Thousands cannot safely commute when rains begin.
            - generic [ref=e423]:
              - generic [ref=e424]: 1,240
              - generic [ref=e425]: signatures
              - generic [ref=e426]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e427] [cursor=pointer]:
          - /url: /petitions/cmovbbvp60002282k7bxyyl43
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e429]
          - generic [ref=e430]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e431]
            - paragraph [ref=e432]: Thousands cannot safely commute when rains begin.
            - generic [ref=e433]:
              - generic [ref=e434]: 1,240
              - generic [ref=e435]: signatures
              - generic [ref=e436]: Growing today
    - generic [ref=e440]:
      - generic [ref=e441]:
        - paragraph [ref=e442]: Support the platform
        - heading "Help keep Change Liberia free and independent" [level=2] [ref=e443]
        - paragraph [ref=e444]: Change Liberia is a non-partisan civic platform built to give every Liberian a verified voice. Your donation funds the infrastructure that connects citizens with decision-makers — from Monrovia to the most rural counties.
        - list [ref=e445]:
          - listitem [ref=e446]:
            - generic [ref=e447]: 🔒
            - generic [ref=e448]:
              - paragraph [ref=e449]: Fraud-resistant signatures
              - paragraph [ref=e450]: Every signature is verified to protect petition integrity.
          - listitem [ref=e451]:
            - generic [ref=e452]: 📡
            - generic [ref=e453]:
              - paragraph [ref=e454]: Real-time transparency
              - paragraph [ref=e455]: Live signature counts show the true weight of public support.
          - listitem [ref=e456]:
            - generic [ref=e457]: 🌍
            - generic [ref=e458]:
              - paragraph [ref=e459]: Built for Liberia
              - paragraph [ref=e460]: Local language support, low-bandwidth optimised, and mobile-first.
      - generic [ref=e462]:
        - generic [ref=e463]:
          - heading "Support This Campaign" [level=3] [ref=e464]
          - paragraph [ref=e465]: Help keep Change Liberia free and independent
        - generic [ref=e466]:
          - paragraph [ref=e467]: "Select an amount:"
          - generic [ref=e468]:
            - button "$5" [ref=e469]
            - button "$10" [ref=e470]
            - button "$25" [ref=e471]
            - button "$50" [ref=e472]
            - button "$100" [ref=e473]
          - generic [ref=e474]:
            - generic [ref=e475]: $
            - spinbutton [ref=e476]
        - button "💝 Make a Donation" [ref=e477]
    - generic [ref=e482]:
      - generic [ref=e483]:
        - paragraph [ref=e484]: Your voice matters
        - heading "We help you shape a clear petition" [level=2] [ref=e485]
        - paragraph [ref=e486]: A few sentences about a problem in your community are enough to start. Add details, photos, and updates as your campaign grows — from Gbarnga to Harper.
        - link "Start your petition →" [ref=e487] [cursor=pointer]:
          - /url: /create
      - generic [ref=e488]:
        - generic [ref=e489]:
          - generic [ref=e490]: ⚡
          - paragraph [ref=e491]: Start in under 3 minutes
        - generic [ref=e492]:
          - generic [ref=e493]: 🔒
          - paragraph [ref=e494]: Verified signatures only
        - generic [ref=e495]:
          - generic [ref=e496]: 📍
          - paragraph [ref=e497]: Reach the right Liberian leaders
        - paragraph [ref=e498]: Free to create. No account needed to browse.
    - generic [ref=e501]:
      - paragraph [ref=e502]: For every Liberian
      - heading "Ready to make change happen?" [level=2] [ref=e503]
      - paragraph [ref=e504]: Change Liberia is built for transparency and trust. From ward to Capitol Hill, your petition keeps leaders accountable and gives every Liberian a verified voice.
      - generic [ref=e505]:
        - link "Start a petition — it's free" [ref=e506] [cursor=pointer]:
          - /url: /create
        - link "Browse petitions" [ref=e507] [cursor=pointer]:
          - /url: /petitions
    - generic [ref=e510]:
      - generic [ref=e511]:
        - generic [ref=e512]:
          - link "Change Liberia" [ref=e513] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e514]
          - paragraph [ref=e515]: Empowering every Liberian to raise issues, gather trusted support, and drive real civic change — from Monrovia to the countryside.
          - generic [ref=e516]:
            - link "Facebook" [ref=e517] [cursor=pointer]:
              - /url: "#"
              - img [ref=e518]
            - link "X (Twitter)" [ref=e520] [cursor=pointer]:
              - /url: "#"
              - img [ref=e521]
        - generic [ref=e523]:
          - heading "Get involved" [level=3] [ref=e524]
          - list [ref=e525]:
            - listitem [ref=e526]:
              - link "Start a petition" [ref=e527] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e528]:
              - link "Browse by topic" [ref=e529] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e530]:
              - link "Search petitions" [ref=e531] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e532]:
              - link "Become a Change Leader 🇱🇷" [ref=e533] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e534]:
              - link "Join the Movement" [ref=e535] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e536]:
              - link "How It Works" [ref=e537] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e538]:
              - link "Become a Voice for Change" [ref=e539] [cursor=pointer]:
                - /url: /apply
        - generic [ref=e540]:
          - heading "Learn" [level=3] [ref=e541]
          - list [ref=e542]:
            - listitem [ref=e543]:
              - link "How it works" [ref=e544] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e545]:
              - link "Create your petition" [ref=e546] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e547]:
              - link "Collect signatures" [ref=e548] [cursor=pointer]:
                - /url: /collect-signatures
        - generic [ref=e549]:
          - heading "About" [level=3] [ref=e550]
          - list [ref=e551]:
            - listitem [ref=e552]:
              - link "Home" [ref=e553] [cursor=pointer]:
                - /url: /
            - listitem [ref=e554]:
              - link "About us" [ref=e555] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e556]:
              - link "Dashboard" [ref=e557] [cursor=pointer]:
                - /url: /dashboard
        - generic [ref=e558]:
          - heading "Help & legal" [level=3] [ref=e559]
          - list [ref=e560]:
            - listitem [ref=e561]:
              - link "Help center" [ref=e562] [cursor=pointer]:
                - /url: /help-center
            - listitem [ref=e563]:
              - link "Community guidelines" [ref=e564] [cursor=pointer]:
                - /url: /community-guidelines
            - listitem [ref=e565]:
              - link "Privacy policy" [ref=e566] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e567]:
              - link "Terms of service" [ref=e568] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e569]:
        - paragraph [ref=e570]: © 2026 Change Liberia. Built for the people of Liberia.
        - generic [ref=e571]:
          - link "Privacy" [ref=e572] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e573] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e574]: English (Liberia)
```

# Test source

```ts
  26  |     await expect(donationWidget).toBeVisible();
  27  |   });
  28  | 
  29  |   test('should display donation preset amounts', async ({ page }) => {
  30  |     await page.goto('/');
  31  | 
  32  |     // Find donation widget
  33  |     const donationWidget = page.locator('[data-testid="donation-widget"]');
  34  |     const presetButtons = donationWidget.locator('button:has-text("$")');
  35  | 
  36  |     const count = await presetButtons.count();
  37  |     expect(count).toBeGreaterThan(0);
  38  |   });
  39  | 
  40  |   test('should allow Mobile Money selection in the donation widget', async ({ page }) => {
  41  |     await page.goto('/');
  42  | 
  43  |     const mobileMoneyButton = page.locator('[data-testid="donation-widget"] button:has-text("MTN Mobile Money")');
  44  |     await expect(mobileMoneyButton).toBeVisible();
  45  |     await mobileMoneyButton.click();
  46  | 
  47  |     const phoneInput = page.locator('[data-testid="donation-widget"] input[name="phoneNumber"]');
  48  |     await expect(phoneInput).toBeVisible();
  49  |   });
  50  | 
  51  |   test('should allow custom donation amount', async ({ page }) => {
  52  |     await page.goto('/');
  53  | 
  54  |     // Find custom amount input
  55  |     const customInput = page.locator('input[name="customAmount"]|input[type="number"][name*="amount"]');
  56  |     
  57  |     if (await customInput.isVisible()) {
  58  |       await fillInput(page, 'input[name="customAmount"]|input[type="number"][name*="amount"]', '50');
  59  | 
  60  |       // Verify value updated
  61  |       const value = await customInput.inputValue();
  62  |       expect(value).toBe('50');
  63  |     }
  64  |   });
  65  | 
  66  |   test('should open donation checkout on preset amount click', async ({ page }) => {
  67  |     await page.goto('/');
  68  | 
  69  |     // Click a preset donation amount
  70  |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$10")');
  71  |     
  72  |     if (await donationButton.isVisible()) {
  73  |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$10")');
  74  | 
  75  |       // Wait for checkout modal or page
  76  |       await page.waitForLoadState('networkidle');
  77  | 
  78  |       // Check for Stripe form or checkout page
  79  |       const stripeFrame = page.frameLocator('iframe[title*="Stripe"]');
  80  |       const checkoutForm = page.locator('[data-testid="checkout-form"]|[data-testid="payment-form"]');
  81  | 
  82  |       let isStripeLoaded = false;
  83  |       try {
  84  |         await stripeFrame.locator('body').waitFor({ timeout: 2000 });
  85  |         isStripeLoaded = true;
  86  |       } catch {
  87  |         isStripeLoaded = false;
  88  |       }
  89  |       const isCheckoutVisible = await checkoutForm.isVisible();
  90  | 
  91  |       expect(isStripeLoaded || isCheckoutVisible).toBeTruthy();
  92  |     }
  93  |   });
  94  | 
  95  |   test('should fill donation form with email', async ({ page }) => {
  96  |     await page.goto('/');
  97  | 
  98  |     // Fill donation widget
  99  |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$25")');
  100 |     
  101 |     if (await donationButton.isVisible()) {
  102 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$25")');
  103 |       await page.waitForLoadState('networkidle');
  104 | 
  105 |       // Fill email if not logged in
  106 |       const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
  107 |       if (await emailInput.isVisible()) {
  108 |         const testEmail = generateTestEmail();
  109 |         await fillInput(page, 'input[name="email"]', testEmail);
  110 |       }
  111 |     }
  112 |   });
  113 | 
  114 |   test('should display donation amount in checkout', async ({ page }) => {
  115 |     await page.goto('/');
  116 | 
  117 |     // Select donation
  118 |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$50")');
  119 |     
  120 |     if (await donationButton.isVisible()) {
  121 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$50")');
  122 |       await page.waitForLoadState('networkidle');
  123 | 
  124 |       // Look for amount display
  125 |       const amountDisplay = page.locator('[data-testid="donation-amount"]|[data-testid="total-amount"]');
> 126 |       const text = await amountDisplay.textContent();
      |                                        ^ Error: locator.textContent: Unexpected token "|" while parsing css selector "[data-testid="donation-amount"]|[data-testid="total-amount"]". Did you mean to CSS.escape it?
  127 |       expect(text).toContain('50');
  128 |     }
  129 |   });
  130 | 
  131 |   test('should make successful donation with test card', async ({ page }) => {
  132 |     // This test uses Stripe's test card: 4242 4242 4242 4242
  133 |     await page.goto('/');
  134 | 
  135 |     // Open donation checkout
  136 |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$20")');
  137 |     if (await donationButton.isVisible()) {
  138 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$20")');
  139 |       await page.waitForLoadState('networkidle');
  140 | 
  141 |       // Fill donor email
  142 |       const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
  143 |       if (await emailInput.isVisible()) {
  144 |         await fillInput(page, 'input[name="email"]', generateTestEmail());
  145 |       }
  146 | 
  147 |       // Fill name
  148 |       const nameInput = page.locator('input[name="name"]|input[name="fullName"]').first();
  149 |       if (await nameInput.isVisible()) {
  150 |         await fillInput(page, 'input[name="name"]', 'Test Donor');
  151 |       }
  152 | 
  153 |       // Fill Stripe card field via iframe
  154 |       const stripeFrame = page.frameLocator('iframe[title*="Stripe"][name*="card"]');
  155 |       const cardNumberField = stripeFrame.locator('input[name="cardnumber"]');
  156 | 
  157 |       if (await cardNumberField.isVisible()) {
  158 |         await cardNumberField.fill('4242424242424242');
  159 | 
  160 |         // Fill expiry
  161 |         const expiryField = stripeFrame.locator('input[name="exp-date"]');
  162 |         await expiryField.fill('1225');
  163 | 
  164 |         // Fill CVC
  165 |         const cvcField = stripeFrame.locator('input[name="cvc"]');
  166 |         await cvcField.fill('123');
  167 |       }
  168 | 
  169 |       // Submit payment
  170 |       const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
  171 |       
  172 |       // Wait for API response
  173 |       const paymentPromise = waitForAPIResponse(page, /payment|charge|donation/i, async () => {
  174 |         await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');
  175 |       });
  176 | 
  177 |       await paymentPromise;
  178 | 
  179 |       // Verify success
  180 |       await expectTextContent(page, '[role="status"]|[data-testid="success-message"]', /success|thank you|receipt/i);
  181 |     }
  182 |   });
  183 | 
  184 |   test('should display donation receipt after payment', async ({ page }) => {
  185 |     // Navigate to donation success page (or receipt page)
  186 |     // In a real scenario, this would be after a successful payment redirect
  187 |     
  188 |     // Check for receipt elements
  189 |     const receiptAmount = page.locator('[data-testid="receipt-amount"]|.receipt-amount');
  190 |     const receiptId = page.locator('[data-testid="receipt-id"]|.receipt-id');
  191 |     const receiptDate = page.locator('[data-testid="receipt-date"]|.receipt-date');
  192 | 
  193 |     // At least one should exist on a receipt page
  194 |     const elementsVisible = [
  195 |       await receiptAmount.isVisible().catch(() => false),
  196 |       await receiptId.isVisible().catch(() => false),
  197 |       await receiptDate.isVisible().catch(() => false),
  198 |     ].some(v => v === true);
  199 | 
  200 |     // This test is conditional based on page structure
  201 |     if (elementsVisible) {
  202 |       expect(elementsVisible).toBeTruthy();
  203 |     }
  204 |   });
  205 | 
  206 |   test('should reject invalid card', async ({ page }) => {
  207 |     // Uses Stripe's test card: 4000 0000 0000 0002 (card declined)
  208 |     await page.goto('/');
  209 | 
  210 |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$15")');
  211 |     if (await donationButton.isVisible()) {
  212 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$15")');
  213 |       await page.waitForLoadState('networkidle');
  214 | 
  215 |       // Fill email
  216 |       const emailInput = page.locator('input[name="email"]|input[type="email"]').first();
  217 |       if (await emailInput.isVisible()) {
  218 |         await fillInput(page, 'input[name="email"]', generateTestEmail());
  219 |       }
  220 | 
  221 |       // Fill form data
  222 |       const nameInput = page.locator('input[name="name"]|input[name="fullName"]').first();
  223 |       if (await nameInput.isVisible()) {
  224 |         await fillInput(page, 'input[name="name"]', 'Test User');
  225 |       }
  226 | 
```
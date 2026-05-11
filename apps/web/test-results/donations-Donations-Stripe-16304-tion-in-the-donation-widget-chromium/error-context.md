# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: donations.spec.ts >> Donations & Stripe Integration >> should allow Mobile Money selection in the donation widget
- Location: tests/e2e/donations.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="donation-widget"] button:has-text("MTN Mobile Money")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="donation-widget"] button:has-text("MTN Mobile Money")')

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
              - /url: /petitions/cmp054xje00021zshki4laxca
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e26]: — 1,240 signatures
            - generic [ref=e27]: ·
          - generic [ref=e28]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e29] [cursor=pointer]:
              - /url: /petitions/cmp0c0ft400029cec7qqmmuez
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e30]: — 1,240 signatures
            - generic [ref=e31]: ·
          - generic [ref=e32]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e33] [cursor=pointer]:
              - /url: /petitions/cmp0blaf20002rzaa86g4lf07
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e34]: — 1,240 signatures
            - generic [ref=e35]: ·
          - generic [ref=e36]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e37] [cursor=pointer]:
              - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e38]: — 1,240 signatures
            - generic [ref=e39]: ·
          - generic [ref=e40]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e41] [cursor=pointer]:
              - /url: /petitions/cmp0byar40002pjgluym81ijm
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e42]: — 1,240 signatures
            - generic [ref=e43]: ·
          - generic [ref=e44]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e45] [cursor=pointer]:
              - /url: /petitions/cmp0b5n8n000217o87ajqu66o
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e46]: — 1,240 signatures
            - generic [ref=e47]: ·
          - generic [ref=e48]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e49] [cursor=pointer]:
              - /url: /petitions/cmp0c8sru0002cip519liwsm0
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e50]: — 1,240 signatures
            - generic [ref=e51]: ·
          - generic [ref=e52]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e53] [cursor=pointer]:
              - /url: /petitions/cmp0c9ley0002ioilqrw20i95
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e54]: — 1,240 signatures
            - generic [ref=e55]: ·
          - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e57] [cursor=pointer]:
            - /url: /petitions/cmovbbvp60002282k7bxyyl43
            - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
            - generic [ref=e58]: — 1,240 signatures
          - generic [ref=e59]: ·
        - generic [ref=e60]:
          - generic [ref=e61]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,241 signatures" [ref=e62] [cursor=pointer]:
              - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e63]: — 1,241 signatures
            - generic [ref=e64]: ·
          - generic [ref=e65]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e66] [cursor=pointer]:
              - /url: /petitions/cmp054xje00021zshki4laxca
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e67]: — 1,240 signatures
            - generic [ref=e68]: ·
          - generic [ref=e69]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e70] [cursor=pointer]:
              - /url: /petitions/cmp0c0ft400029cec7qqmmuez
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e71]: — 1,240 signatures
            - generic [ref=e72]: ·
          - generic [ref=e73]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e74] [cursor=pointer]:
              - /url: /petitions/cmp0blaf20002rzaa86g4lf07
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e75]: — 1,240 signatures
            - generic [ref=e76]: ·
          - generic [ref=e77]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e78] [cursor=pointer]:
              - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e79]: — 1,240 signatures
            - generic [ref=e80]: ·
          - generic [ref=e81]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e82] [cursor=pointer]:
              - /url: /petitions/cmp0byar40002pjgluym81ijm
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e83]: — 1,240 signatures
            - generic [ref=e84]: ·
          - generic [ref=e85]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e86] [cursor=pointer]:
              - /url: /petitions/cmp0b5n8n000217o87ajqu66o
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e87]: — 1,240 signatures
            - generic [ref=e88]: ·
          - generic [ref=e89]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e90] [cursor=pointer]:
              - /url: /petitions/cmp0c8sru0002cip519liwsm0
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e91]: — 1,240 signatures
            - generic [ref=e92]: ·
          - generic [ref=e93]:
            - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e94] [cursor=pointer]:
              - /url: /petitions/cmp0c9ley0002ioilqrw20i95
              - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
              - generic [ref=e95]: — 1,240 signatures
            - generic [ref=e96]: ·
          - link "🔥 Fix Sinkor Community Roads Before Rainy Season— 1,240 signatures" [ref=e98] [cursor=pointer]:
            - /url: /petitions/cmovbbvp60002282k7bxyyl43
            - text: 🔥 Fix Sinkor Community Roads Before Rainy Season
            - generic [ref=e99]: — 1,240 signatures
          - generic [ref=e100]: ·
    - banner [ref=e101]:
      - generic [ref=e102]:
        - generic [ref=e103]:
          - link "Change Liberia" [ref=e104] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e105]
          - navigation [ref=e106]:
            - link "Search" [ref=e107] [cursor=pointer]:
              - /url: /petitions
              - generic [ref=e108]: 🔍
              - generic [ref=e109]: Search
            - link "Donate" [ref=e110] [cursor=pointer]:
              - /url: /#donate
        - generic [ref=e111]:
          - link "Start a petition" [ref=e112] [cursor=pointer]:
            - /url: /create
          - button "+ Join 🇱🇷 0" [ref=e113]:
            - generic [ref=e114]: + Join 🇱🇷
            - generic [ref=e115]: "0"
          - button "Switch to dark mode" [ref=e116]:
            - img [ref=e117]
          - generic [ref=e119]:
            - link "Sign up" [ref=e120] [cursor=pointer]:
              - /url: /auth/signup
            - link "Log in" [ref=e121] [cursor=pointer]:
              - /url: /auth/login
  - main [ref=e122]:
    - generic [ref=e123]:
      - generic:
        - img
      - generic [ref=e124]:
        - generic [ref=e125]:
          - img
          - generic [ref=e127]:
            - generic [ref=e128]: 🇱🇷 Liberia's civic petition platform
            - heading "Change Liberia starts with you." [level=1] [ref=e129]:
              - text: Change Liberia
              - text: starts with you.
            - paragraph [ref=e130]: Join thousands of Liberians raising real issues — from roads in Sinkor to schools in Lofa. Gather verified support and move leaders to act.
            - generic [ref=e131]: 10,247 signatures today
            - generic [ref=e132]:
              - button "Start a petition" [ref=e133] [cursor=pointer]
              - link "Browse causes →" [ref=e134] [cursor=pointer]:
                - /url: /petitions
        - generic [ref=e135]:
          - img
          - generic [ref=e140]:
            - generic [ref=e141]:
              - heading "What change does Liberia need?" [level=2] [ref=e142]
              - paragraph [ref=e143]: Start by sharing the issue you care about. We'll guide you through the rest.
            - generic [ref=e144]:
              - generic [ref=e145]:
                - textbox "Type something..." [ref=e146]
                - generic:
                  - generic:
                    - generic: Fix the drainage on
              - paragraph [ref=e148]: 0 / 120 characters
            - button "Create petition" [disabled] [ref=e149]
            - paragraph [ref=e150]: Your petition will be reviewed before going live. It's free and takes less than 5 minutes.
    - generic [ref=e153]:
      - generic [ref=e154]:
        - generic [ref=e155]:
          - paragraph [ref=e156]: 21+
          - paragraph [ref=e157]: Petitions created
        - generic [ref=e158]:
          - paragraph [ref=e159]: 26K+
          - paragraph [ref=e160]: Verified signatures
        - generic [ref=e161]:
          - paragraph [ref=e162]: "0"
          - paragraph [ref=e163]: Campaigns won
        - generic [ref=e164]:
          - paragraph [ref=e165]: "15"
          - paragraph [ref=e166]: Counties reached
      - paragraph [ref=e167]: Join Liberians using verified petitions to speak up for schools, roads, health, and justice — county by county.
    - generic [ref=e170]:
      - paragraph [ref=e171]: 🔥 Trending campaign
      - generic [ref=e175]:
        - generic [ref=e176]:
          - generic [ref=e177]: 🟢 Active
          - generic [ref=e178]: ✎ 1,241 signatures
        - heading "Fix Sinkor Community Roads Before Rainy Season" [level=2] [ref=e179]
        - paragraph [ref=e180]: Thousands cannot safely commute when rains begin.
        - generic [ref=e181]:
          - link "Sign this petition" [ref=e182] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v#sign
          - link "Read full story →" [ref=e183] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
    - generic [ref=e186]:
      - generic [ref=e187]:
        - paragraph [ref=e188]: How it works
        - heading "Civic action for Liberia, made simple" [level=2] [ref=e189]
        - paragraph [ref=e190]: Change Liberia is a structured civic process — from a citizen raising an issue to a government authority formally receiving and responding to it.
      - generic [ref=e191]:
        - generic [ref=e193]:
          - generic [ref=e194]:
            - generic [ref=e195]: ✍️
            - generic [ref=e196]: "1"
          - heading "Submit your issue" [level=3] [ref=e198]
          - paragraph [ref=e199]: Describe what needs to change. Choose categories, add prior actions taken, and set your signature goal. Takes under 3 minutes.
        - generic [ref=e201]:
          - generic [ref=e202]:
            - generic [ref=e203]: 🔎
            - generic [ref=e204]: "2"
          - heading "Petition is reviewed" [level=3] [ref=e206]
          - paragraph [ref=e207]: Our team reviews every petition within 24–48 hours to confirm it is a genuine civic issue. Legitimate grievances are never suppressed.
        - generic [ref=e209]:
          - generic [ref=e210]:
            - generic [ref=e211]: 🤝
            - generic [ref=e212]: "3"
          - heading "People sign & support" [level=3] [ref=e214]
          - paragraph [ref=e215]: Share your petition. Verified Liberian signatures carry far more weight with decision-makers than unverified ones.
        - generic [ref=e217]:
          - generic [ref=e218]:
            - generic [ref=e219]: 📊
            - generic [ref=e220]: "4"
          - heading "Threshold reached" [level=3] [ref=e222]
          - paragraph [ref=e223]: At 1,000 verified signatures a formal PDF report is generated, ready for official submission to the right authority.
        - generic [ref=e225]:
          - generic [ref=e226]:
            - generic [ref=e227]: 📬
            - generic [ref=e228]: "5"
          - heading "Delivered to authority" [level=3] [ref=e230]
          - paragraph [ref=e231]: Smart routing identifies the correct Ministry, Legislature, or County official and delivers the petition formally with a digital record.
        - generic [ref=e233]:
          - generic [ref=e234]:
            - generic [ref=e235]: 📣
            - generic [ref=e236]: "6"
          - heading "Response tracked publicly" [level=3] [ref=e237]
          - paragraph [ref=e238]: The official response — or silence — is tracked and shown publicly on the petition page. No response is also a public fact.
      - generic [ref=e239]:
        - link "Start a petition — it's free" [ref=e240] [cursor=pointer]:
          - /url: /create
        - link "Full process details →" [ref=e241] [cursor=pointer]:
          - /url: /how-it-works
    - generic [ref=e244]:
      - generic [ref=e245]:
        - paragraph [ref=e246]: Active campaigns
        - heading "Discover causes" [level=2] [ref=e247]
        - paragraph [ref=e248]: Petitions gaining momentum across Liberia
        - generic [ref=e251]:
          - generic [ref=e252]:
            - textbox "Search petitions by title, topic, or cause..." [ref=e253]
            - img
          - button "Search" [ref=e254]
          - button "Advanced filters" [ref=e255]:
            - img [ref=e256]
      - generic [ref=e258]:
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,241 signatures Growing today" [ref=e259] [cursor=pointer]:
          - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e261]
          - generic [ref=e262]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e263]
            - paragraph [ref=e264]: Thousands cannot safely commute when rains begin.
            - generic [ref=e265]:
              - generic [ref=e266]: 1,241
              - generic [ref=e267]: signatures
              - generic [ref=e268]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e269] [cursor=pointer]:
          - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e271]
          - generic [ref=e272]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e273]
            - paragraph [ref=e274]: Thousands cannot safely commute when rains begin.
            - generic [ref=e275]:
              - generic [ref=e276]: 1,240
              - generic [ref=e277]: signatures
              - generic [ref=e278]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e279] [cursor=pointer]:
          - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e281]
          - generic [ref=e282]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e283]
            - paragraph [ref=e284]: Thousands cannot safely commute when rains begin.
            - generic [ref=e285]:
              - generic [ref=e286]: 1,240
              - generic [ref=e287]: signatures
              - generic [ref=e288]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e289] [cursor=pointer]:
          - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e291]
          - generic [ref=e292]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e293]
            - paragraph [ref=e294]: Thousands cannot safely commute when rains begin.
            - generic [ref=e295]:
              - generic [ref=e296]: 1,240
              - generic [ref=e297]: signatures
              - generic [ref=e298]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e299] [cursor=pointer]:
          - /url: /petitions/cmp0dilc50002bqpe4andpdu3
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e301]
          - generic [ref=e302]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e303]
            - paragraph [ref=e304]: Thousands cannot safely commute when rains begin.
            - generic [ref=e305]:
              - generic [ref=e306]: 1,240
              - generic [ref=e307]: signatures
              - generic [ref=e308]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e309] [cursor=pointer]:
          - /url: /petitions/cmp0blaf20002rzaa86g4lf07
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e311]
          - generic [ref=e312]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e313]
            - paragraph [ref=e314]: Thousands cannot safely commute when rains begin.
            - generic [ref=e315]:
              - generic [ref=e316]: 1,240
              - generic [ref=e317]: signatures
              - generic [ref=e318]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e319] [cursor=pointer]:
          - /url: /petitions/cmp0cqep50002b6vl4uyfawu8
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e321]
          - generic [ref=e322]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e323]
            - paragraph [ref=e324]: Thousands cannot safely commute when rains begin.
            - generic [ref=e325]:
              - generic [ref=e326]: 1,240
              - generic [ref=e327]: signatures
              - generic [ref=e328]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e329] [cursor=pointer]:
          - /url: /petitions/cmp0cnrf10002rtwfunt5grt1
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e331]
          - generic [ref=e332]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e333]
            - paragraph [ref=e334]: Thousands cannot safely commute when rains begin.
            - generic [ref=e335]:
              - generic [ref=e336]: 1,240
              - generic [ref=e337]: signatures
              - generic [ref=e338]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e339] [cursor=pointer]:
          - /url: /petitions/cmp0clods00024vl2kxmjlsll
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e341]
          - generic [ref=e342]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e343]
            - paragraph [ref=e344]: Thousands cannot safely commute when rains begin.
            - generic [ref=e345]:
              - generic [ref=e346]: 1,240
              - generic [ref=e347]: signatures
              - generic [ref=e348]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e349] [cursor=pointer]:
          - /url: /petitions/cmp0cjzuk0002haeic0apg05b
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e351]
          - generic [ref=e352]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e353]
            - paragraph [ref=e354]: Thousands cannot safely commute when rains begin.
            - generic [ref=e355]:
              - generic [ref=e356]: 1,240
              - generic [ref=e357]: signatures
              - generic [ref=e358]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e359] [cursor=pointer]:
          - /url: /petitions/cmp0cg81f000214kdymrcnlvz
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e361]
          - generic [ref=e362]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e363]
            - paragraph [ref=e364]: Thousands cannot safely commute when rains begin.
            - generic [ref=e365]:
              - generic [ref=e366]: 1,240
              - generic [ref=e367]: signatures
              - generic [ref=e368]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e369] [cursor=pointer]:
          - /url: /petitions/cmp0cdu1a000242m924n644t5
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e371]
          - generic [ref=e372]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e373]
            - paragraph [ref=e374]: Thousands cannot safely commute when rains begin.
            - generic [ref=e375]:
              - generic [ref=e376]: 1,240
              - generic [ref=e377]: signatures
              - generic [ref=e378]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e379] [cursor=pointer]:
          - /url: /petitions/cmp0cbjcl0002mffb1bsbeive
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e381]
          - generic [ref=e382]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e383]
            - paragraph [ref=e384]: Thousands cannot safely commute when rains begin.
            - generic [ref=e385]:
              - generic [ref=e386]: 1,240
              - generic [ref=e387]: signatures
              - generic [ref=e388]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e389] [cursor=pointer]:
          - /url: /petitions/cmp0c9ley0002ioilqrw20i95
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e391]
          - generic [ref=e392]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e393]
            - paragraph [ref=e394]: Thousands cannot safely commute when rains begin.
            - generic [ref=e395]:
              - generic [ref=e396]: 1,240
              - generic [ref=e397]: signatures
              - generic [ref=e398]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e399] [cursor=pointer]:
          - /url: /petitions/cmp0c8sru0002cip519liwsm0
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e401]
          - generic [ref=e402]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e403]
            - paragraph [ref=e404]: Thousands cannot safely commute when rains begin.
            - generic [ref=e405]:
              - generic [ref=e406]: 1,240
              - generic [ref=e407]: signatures
              - generic [ref=e408]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e409] [cursor=pointer]:
          - /url: /petitions/cmp0c0ft400029cec7qqmmuez
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e411]
          - generic [ref=e412]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e413]
            - paragraph [ref=e414]: Thousands cannot safely commute when rains begin.
            - generic [ref=e415]:
              - generic [ref=e416]: 1,240
              - generic [ref=e417]: signatures
              - generic [ref=e418]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e419] [cursor=pointer]:
          - /url: /petitions/cmp0byar40002pjgluym81ijm
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e421]
          - generic [ref=e422]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e423]
            - paragraph [ref=e424]: Thousands cannot safely commute when rains begin.
            - generic [ref=e425]:
              - generic [ref=e426]: 1,240
              - generic [ref=e427]: signatures
              - generic [ref=e428]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e429] [cursor=pointer]:
          - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e431]
          - generic [ref=e432]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e433]
            - paragraph [ref=e434]: Thousands cannot safely commute when rains begin.
            - generic [ref=e435]:
              - generic [ref=e436]: 1,240
              - generic [ref=e437]: signatures
              - generic [ref=e438]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e439] [cursor=pointer]:
          - /url: /petitions/cmp0b5n8n000217o87ajqu66o
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e441]
          - generic [ref=e442]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e443]
            - paragraph [ref=e444]: Thousands cannot safely commute when rains begin.
            - generic [ref=e445]:
              - generic [ref=e446]: 1,240
              - generic [ref=e447]: signatures
              - generic [ref=e448]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e449] [cursor=pointer]:
          - /url: /petitions/cmp054xje00021zshki4laxca
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e451]
          - generic [ref=e452]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e453]
            - paragraph [ref=e454]: Thousands cannot safely commute when rains begin.
            - generic [ref=e455]:
              - generic [ref=e456]: 1,240
              - generic [ref=e457]: signatures
              - generic [ref=e458]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e459] [cursor=pointer]:
          - /url: /petitions/cmovbbvp60002282k7bxyyl43
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e461]
          - generic [ref=e462]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e463]
            - paragraph [ref=e464]: Thousands cannot safely commute when rains begin.
            - generic [ref=e465]:
              - generic [ref=e466]: 1,240
              - generic [ref=e467]: signatures
              - generic [ref=e468]: Growing today
    - generic [ref=e472]:
      - generic [ref=e473]:
        - paragraph [ref=e474]: Support the platform
        - heading "Help keep Change Liberia free and independent" [level=2] [ref=e475]
        - paragraph [ref=e476]: Change Liberia is a non-partisan civic platform built to give every Liberian a verified voice. Your donation funds the infrastructure that connects citizens with decision-makers — from Monrovia to the most rural counties.
        - list [ref=e477]:
          - listitem [ref=e478]:
            - generic [ref=e479]: 🔒
            - generic [ref=e480]:
              - paragraph [ref=e481]: Fraud-resistant signatures
              - paragraph [ref=e482]: Every signature is verified to protect petition integrity.
          - listitem [ref=e483]:
            - generic [ref=e484]: 📡
            - generic [ref=e485]:
              - paragraph [ref=e486]: Real-time transparency
              - paragraph [ref=e487]: Live signature counts show the true weight of public support.
          - listitem [ref=e488]:
            - generic [ref=e489]: 🌍
            - generic [ref=e490]:
              - paragraph [ref=e491]: Built for Liberia
              - paragraph [ref=e492]: Local language support, low-bandwidth optimised, and mobile-first.
      - generic [ref=e494]:
        - generic [ref=e495]:
          - heading "Support This Campaign" [level=3] [ref=e496]
          - paragraph [ref=e497]: Help keep Change Liberia free and independent
        - generic [ref=e498]:
          - paragraph [ref=e499]: "Select an amount:"
          - generic [ref=e500]:
            - button "$5" [ref=e501]
            - button "$10" [ref=e502]
            - button "$25" [ref=e503]
            - button "$50" [ref=e504]
            - button "$100" [ref=e505]
          - generic [ref=e506]:
            - generic [ref=e507]: $
            - spinbutton [ref=e508]
        - button "💝 Make a Donation" [ref=e509]
    - generic [ref=e514]:
      - generic [ref=e515]:
        - paragraph [ref=e516]: Your voice matters
        - heading "We help you shape a clear petition" [level=2] [ref=e517]
        - paragraph [ref=e518]: A few sentences about a problem in your community are enough to start. Add details, photos, and updates as your campaign grows — from Gbarnga to Harper.
        - link "Start your petition →" [ref=e519] [cursor=pointer]:
          - /url: /create
      - generic [ref=e520]:
        - generic [ref=e521]:
          - generic [ref=e522]: ⚡
          - paragraph [ref=e523]: Start in under 3 minutes
        - generic [ref=e524]:
          - generic [ref=e525]: 🔒
          - paragraph [ref=e526]: Verified signatures only
        - generic [ref=e527]:
          - generic [ref=e528]: 📍
          - paragraph [ref=e529]: Reach the right Liberian leaders
        - paragraph [ref=e530]: Free to create. No account needed to browse.
    - generic [ref=e533]:
      - paragraph [ref=e534]: For every Liberian
      - heading "Ready to make change happen?" [level=2] [ref=e535]
      - paragraph [ref=e536]: Change Liberia is built for transparency and trust. From ward to Capitol Hill, your petition keeps leaders accountable and gives every Liberian a verified voice.
      - generic [ref=e537]:
        - link "Start a petition — it's free" [ref=e538] [cursor=pointer]:
          - /url: /create
        - link "Browse petitions" [ref=e539] [cursor=pointer]:
          - /url: /petitions
    - generic [ref=e542]:
      - generic [ref=e543]:
        - generic [ref=e544]:
          - link "Change Liberia" [ref=e545] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e546]
          - paragraph [ref=e547]: Empowering every Liberian to raise issues, gather trusted support, and drive real civic change — from Monrovia to the countryside.
          - generic [ref=e548]:
            - link "Facebook" [ref=e549] [cursor=pointer]:
              - /url: "#"
              - img [ref=e550]
            - link "X (Twitter)" [ref=e552] [cursor=pointer]:
              - /url: "#"
              - img [ref=e553]
        - generic [ref=e555]:
          - heading "Get involved" [level=3] [ref=e556]
          - list [ref=e557]:
            - listitem [ref=e558]:
              - link "Start a petition" [ref=e559] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e560]:
              - link "Browse by topic" [ref=e561] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e562]:
              - link "Search petitions" [ref=e563] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e564]:
              - link "Become a Change Leader 🇱🇷" [ref=e565] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e566]:
              - link "Join the Movement" [ref=e567] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e568]:
              - link "How It Works" [ref=e569] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e570]:
              - link "Become a Voice for Change" [ref=e571] [cursor=pointer]:
                - /url: /apply
        - generic [ref=e572]:
          - heading "Learn" [level=3] [ref=e573]
          - list [ref=e574]:
            - listitem [ref=e575]:
              - link "How it works" [ref=e576] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e577]:
              - link "Create your petition" [ref=e578] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e579]:
              - link "Collect signatures" [ref=e580] [cursor=pointer]:
                - /url: /collect-signatures
        - generic [ref=e581]:
          - heading "About" [level=3] [ref=e582]
          - list [ref=e583]:
            - listitem [ref=e584]:
              - link "Home" [ref=e585] [cursor=pointer]:
                - /url: /
            - listitem [ref=e586]:
              - link "About us" [ref=e587] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e588]:
              - link "Dashboard" [ref=e589] [cursor=pointer]:
                - /url: /dashboard
        - generic [ref=e590]:
          - heading "Help & legal" [level=3] [ref=e591]
          - list [ref=e592]:
            - listitem [ref=e593]:
              - link "Help center" [ref=e594] [cursor=pointer]:
                - /url: /help-center
            - listitem [ref=e595]:
              - link "Community guidelines" [ref=e596] [cursor=pointer]:
                - /url: /community-guidelines
            - listitem [ref=e597]:
              - link "Privacy policy" [ref=e598] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e599]:
              - link "Terms of service" [ref=e600] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e601]:
        - paragraph [ref=e602]: © 2026 Change Liberia. Built for the people of Liberia.
        - generic [ref=e603]:
          - link "Privacy" [ref=e604] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e605] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e606]: English (Liberia)
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import {
  3   |   fillInput,
  4   |   clickElement,
  5   |   expectTextContent,
  6   |   generateTestEmail,
  7   |   generateTestPassword,
  8   |   waitForNavigation,
  9   |   getText,
  10  |   fillForm,
  11  |   isVisible,
  12  |   waitForAPIResponse,
  13  | } from './test-helpers';
  14  | 
  15  | /**
  16  |  * Donations & Stripe E2E tests
  17  |  * Tests: donation widget, checkout, payment flow, receipts
  18  |  */
  19  | 
  20  | test.describe('Donations & Stripe Integration', () => {
  21  |   test('should display donation widget on home page', async ({ page }) => {
  22  |     await page.goto('/');
  23  | 
  24  |     // Check for donation widget
  25  |     const donationWidget = page.locator('[data-testid="donation-widget"]|[data-testid="donate-section"]');
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
> 44  |     await expect(mobileMoneyButton).toBeVisible();
      |                                     ^ Error: expect(locator).toBeVisible() failed
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
  126 |       const text = await amountDisplay.textContent();
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
```
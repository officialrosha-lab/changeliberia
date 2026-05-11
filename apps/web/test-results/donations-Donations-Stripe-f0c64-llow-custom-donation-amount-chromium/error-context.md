# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: donations.spec.ts >> Donations & Stripe Integration >> should allow custom donation amount
- Location: tests/e2e/donations.spec.ts:51:7

# Error details

```
Error: locator.isVisible: Unexpected token "|" while parsing css selector "input[name="customAmount"]|input[type="number"][name*="amount"]". Did you mean to CSS.escape it?
Call log:
    - checking visibility of input[name="customAmount"]|input[type="number"][name*="amount"]

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
          - generic [ref=e20]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
          - generic [ref=e21]: ·
          - generic [ref=e22]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
          - generic [ref=e23]: ·
        - generic [ref=e24]:
          - generic [ref=e25]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
          - generic [ref=e26]: ·
          - generic [ref=e27]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
          - generic [ref=e28]: ·
    - banner [ref=e29]:
      - generic [ref=e30]:
        - generic [ref=e31]:
          - link "Change Liberia" [ref=e32] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e33]
          - navigation [ref=e34]:
            - link "Search" [ref=e35] [cursor=pointer]:
              - /url: /petitions
              - generic [ref=e36]: 🔍
              - generic [ref=e37]: Search
            - link "Donate" [ref=e38] [cursor=pointer]:
              - /url: /#donate
        - generic [ref=e39]:
          - link "Start a petition" [ref=e40] [cursor=pointer]:
            - /url: /create
          - button "+ Join 🇱🇷 0" [ref=e41]:
            - generic [ref=e42]: + Join 🇱🇷
            - generic [ref=e43]: "0"
          - button "Switch to dark mode" [ref=e44]:
            - img [ref=e45]
          - generic [ref=e47]:
            - link "Sign up" [ref=e48] [cursor=pointer]:
              - /url: /auth/signup
            - link "Log in" [ref=e49] [cursor=pointer]:
              - /url: /auth/login
  - main [ref=e50]:
    - generic [ref=e51]:
      - generic:
        - img
      - generic [ref=e52]:
        - generic [ref=e53]:
          - img
          - generic [ref=e55]:
            - generic [ref=e56]: 🇱🇷 Liberia's civic petition platform
            - heading "Change Liberia starts with you." [level=1] [ref=e57]:
              - text: Change Liberia
              - text: starts with you.
            - paragraph [ref=e58]: Join thousands of Liberians raising real issues — from roads in Sinkor to schools in Lofa. Gather verified support and move leaders to act.
            - generic [ref=e59]: 10,247 signatures today
            - generic [ref=e60]:
              - button "Start a petition" [ref=e61] [cursor=pointer]
              - link "Browse causes →" [ref=e62] [cursor=pointer]:
                - /url: /petitions
        - generic [ref=e63]:
          - img
          - generic [ref=e68]:
            - generic [ref=e69]:
              - heading "What change does Liberia need?" [level=2] [ref=e70]
              - paragraph [ref=e71]: Start by sharing the issue you care about. We'll guide you through the rest.
            - generic [ref=e72]:
              - generic [ref=e73]:
                - textbox "Type something..." [ref=e74]
                - generic:
                  - generic:
                    - generic: Fix the drainage on T
              - paragraph [ref=e76]: 0 / 120 characters
            - button "Create petition" [disabled] [ref=e77]
            - paragraph [ref=e78]: Your petition will be reviewed before going live. It's free and takes less than 5 minutes.
    - generic [ref=e81]:
      - generic [ref=e82]:
        - generic [ref=e83]:
          - paragraph [ref=e84]: 21+
          - paragraph [ref=e85]: Petitions created
        - generic [ref=e86]:
          - paragraph [ref=e87]: 26K+
          - paragraph [ref=e88]: Verified signatures
        - generic [ref=e89]:
          - paragraph [ref=e90]: "0"
          - paragraph [ref=e91]: Campaigns won
        - generic [ref=e92]:
          - paragraph [ref=e93]: "15"
          - paragraph [ref=e94]: Counties reached
      - paragraph [ref=e95]: Join Liberians using verified petitions to speak up for schools, roads, health, and justice — county by county.
    - generic [ref=e98]:
      - paragraph [ref=e99]: 🔥 Trending campaign
      - generic [ref=e103]:
        - generic [ref=e104]:
          - generic [ref=e105]: 🟢 Active
          - generic [ref=e106]: ✎ 1,241 signatures
        - heading "Fix Sinkor Community Roads Before Rainy Season" [level=2] [ref=e107]
        - paragraph [ref=e108]: Thousands cannot safely commute when rains begin.
        - generic [ref=e109]:
          - link "Sign this petition" [ref=e110] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v#sign
          - link "Read full story →" [ref=e111] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
    - generic [ref=e114]:
      - generic [ref=e115]:
        - paragraph [ref=e116]: How it works
        - heading "Civic action for Liberia, made simple" [level=2] [ref=e117]
        - paragraph [ref=e118]: Change Liberia is a structured civic process — from a citizen raising an issue to a government authority formally receiving and responding to it.
      - generic [ref=e119]:
        - generic [ref=e121]:
          - generic [ref=e122]:
            - generic [ref=e123]: ✍️
            - generic [ref=e124]: "1"
          - heading "Submit your issue" [level=3] [ref=e126]
          - paragraph [ref=e127]: Describe what needs to change. Choose categories, add prior actions taken, and set your signature goal. Takes under 3 minutes.
        - generic [ref=e129]:
          - generic [ref=e130]:
            - generic [ref=e131]: 🔎
            - generic [ref=e132]: "2"
          - heading "Petition is reviewed" [level=3] [ref=e134]
          - paragraph [ref=e135]: Our team reviews every petition within 24–48 hours to confirm it is a genuine civic issue. Legitimate grievances are never suppressed.
        - generic [ref=e137]:
          - generic [ref=e138]:
            - generic [ref=e139]: 🤝
            - generic [ref=e140]: "3"
          - heading "People sign & support" [level=3] [ref=e142]
          - paragraph [ref=e143]: Share your petition. Verified Liberian signatures carry far more weight with decision-makers than unverified ones.
        - generic [ref=e145]:
          - generic [ref=e146]:
            - generic [ref=e147]: 📊
            - generic [ref=e148]: "4"
          - heading "Threshold reached" [level=3] [ref=e150]
          - paragraph [ref=e151]: At 1,000 verified signatures a formal PDF report is generated, ready for official submission to the right authority.
        - generic [ref=e153]:
          - generic [ref=e154]:
            - generic [ref=e155]: 📬
            - generic [ref=e156]: "5"
          - heading "Delivered to authority" [level=3] [ref=e158]
          - paragraph [ref=e159]: Smart routing identifies the correct Ministry, Legislature, or County official and delivers the petition formally with a digital record.
        - generic [ref=e161]:
          - generic [ref=e162]:
            - generic [ref=e163]: 📣
            - generic [ref=e164]: "6"
          - heading "Response tracked publicly" [level=3] [ref=e165]
          - paragraph [ref=e166]: The official response — or silence — is tracked and shown publicly on the petition page. No response is also a public fact.
      - generic [ref=e167]:
        - link "Start a petition — it's free" [ref=e168] [cursor=pointer]:
          - /url: /create
        - link "Full process details →" [ref=e169] [cursor=pointer]:
          - /url: /how-it-works
    - generic [ref=e172]:
      - generic [ref=e173]:
        - paragraph [ref=e174]: Active campaigns
        - heading "Discover causes" [level=2] [ref=e175]
        - paragraph [ref=e176]: Petitions gaining momentum across Liberia
        - generic [ref=e179]:
          - generic [ref=e180]:
            - textbox "Search petitions by title, topic, or cause..." [ref=e181]
            - img
          - button "Search" [ref=e182]
          - button "Advanced filters" [ref=e183]:
            - img [ref=e184]
      - generic [ref=e186]:
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,241 signatures Growing today" [ref=e187] [cursor=pointer]:
          - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e189]
          - generic [ref=e190]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e191]
            - paragraph [ref=e192]: Thousands cannot safely commute when rains begin.
            - generic [ref=e193]:
              - generic [ref=e194]: 1,241
              - generic [ref=e195]: signatures
              - generic [ref=e196]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e197] [cursor=pointer]:
          - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e199]
          - generic [ref=e200]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e201]
            - paragraph [ref=e202]: Thousands cannot safely commute when rains begin.
            - generic [ref=e203]:
              - generic [ref=e204]: 1,240
              - generic [ref=e205]: signatures
              - generic [ref=e206]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e207] [cursor=pointer]:
          - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e209]
          - generic [ref=e210]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e211]
            - paragraph [ref=e212]: Thousands cannot safely commute when rains begin.
            - generic [ref=e213]:
              - generic [ref=e214]: 1,240
              - generic [ref=e215]: signatures
              - generic [ref=e216]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e217] [cursor=pointer]:
          - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e219]
          - generic [ref=e220]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e221]
            - paragraph [ref=e222]: Thousands cannot safely commute when rains begin.
            - generic [ref=e223]:
              - generic [ref=e224]: 1,240
              - generic [ref=e225]: signatures
              - generic [ref=e226]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e227] [cursor=pointer]:
          - /url: /petitions/cmp0dilc50002bqpe4andpdu3
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e229]
          - generic [ref=e230]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e231]
            - paragraph [ref=e232]: Thousands cannot safely commute when rains begin.
            - generic [ref=e233]:
              - generic [ref=e234]: 1,240
              - generic [ref=e235]: signatures
              - generic [ref=e236]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e237] [cursor=pointer]:
          - /url: /petitions/cmp0blaf20002rzaa86g4lf07
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e239]
          - generic [ref=e240]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e241]
            - paragraph [ref=e242]: Thousands cannot safely commute when rains begin.
            - generic [ref=e243]:
              - generic [ref=e244]: 1,240
              - generic [ref=e245]: signatures
              - generic [ref=e246]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e247] [cursor=pointer]:
          - /url: /petitions/cmp0cqep50002b6vl4uyfawu8
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e249]
          - generic [ref=e250]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e251]
            - paragraph [ref=e252]: Thousands cannot safely commute when rains begin.
            - generic [ref=e253]:
              - generic [ref=e254]: 1,240
              - generic [ref=e255]: signatures
              - generic [ref=e256]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e257] [cursor=pointer]:
          - /url: /petitions/cmp0cnrf10002rtwfunt5grt1
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e259]
          - generic [ref=e260]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e261]
            - paragraph [ref=e262]: Thousands cannot safely commute when rains begin.
            - generic [ref=e263]:
              - generic [ref=e264]: 1,240
              - generic [ref=e265]: signatures
              - generic [ref=e266]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e267] [cursor=pointer]:
          - /url: /petitions/cmp0clods00024vl2kxmjlsll
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e269]
          - generic [ref=e270]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e271]
            - paragraph [ref=e272]: Thousands cannot safely commute when rains begin.
            - generic [ref=e273]:
              - generic [ref=e274]: 1,240
              - generic [ref=e275]: signatures
              - generic [ref=e276]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e277] [cursor=pointer]:
          - /url: /petitions/cmp0cjzuk0002haeic0apg05b
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e279]
          - generic [ref=e280]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e281]
            - paragraph [ref=e282]: Thousands cannot safely commute when rains begin.
            - generic [ref=e283]:
              - generic [ref=e284]: 1,240
              - generic [ref=e285]: signatures
              - generic [ref=e286]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e287] [cursor=pointer]:
          - /url: /petitions/cmp0cg81f000214kdymrcnlvz
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e289]
          - generic [ref=e290]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e291]
            - paragraph [ref=e292]: Thousands cannot safely commute when rains begin.
            - generic [ref=e293]:
              - generic [ref=e294]: 1,240
              - generic [ref=e295]: signatures
              - generic [ref=e296]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e297] [cursor=pointer]:
          - /url: /petitions/cmp0cdu1a000242m924n644t5
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e299]
          - generic [ref=e300]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e301]
            - paragraph [ref=e302]: Thousands cannot safely commute when rains begin.
            - generic [ref=e303]:
              - generic [ref=e304]: 1,240
              - generic [ref=e305]: signatures
              - generic [ref=e306]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e307] [cursor=pointer]:
          - /url: /petitions/cmp0cbjcl0002mffb1bsbeive
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e309]
          - generic [ref=e310]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e311]
            - paragraph [ref=e312]: Thousands cannot safely commute when rains begin.
            - generic [ref=e313]:
              - generic [ref=e314]: 1,240
              - generic [ref=e315]: signatures
              - generic [ref=e316]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e317] [cursor=pointer]:
          - /url: /petitions/cmp0c9ley0002ioilqrw20i95
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e319]
          - generic [ref=e320]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e321]
            - paragraph [ref=e322]: Thousands cannot safely commute when rains begin.
            - generic [ref=e323]:
              - generic [ref=e324]: 1,240
              - generic [ref=e325]: signatures
              - generic [ref=e326]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e327] [cursor=pointer]:
          - /url: /petitions/cmp0c8sru0002cip519liwsm0
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e329]
          - generic [ref=e330]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e331]
            - paragraph [ref=e332]: Thousands cannot safely commute when rains begin.
            - generic [ref=e333]:
              - generic [ref=e334]: 1,240
              - generic [ref=e335]: signatures
              - generic [ref=e336]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e337] [cursor=pointer]:
          - /url: /petitions/cmp0c0ft400029cec7qqmmuez
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e339]
          - generic [ref=e340]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e341]
            - paragraph [ref=e342]: Thousands cannot safely commute when rains begin.
            - generic [ref=e343]:
              - generic [ref=e344]: 1,240
              - generic [ref=e345]: signatures
              - generic [ref=e346]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e347] [cursor=pointer]:
          - /url: /petitions/cmp0byar40002pjgluym81ijm
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e349]
          - generic [ref=e350]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e351]
            - paragraph [ref=e352]: Thousands cannot safely commute when rains begin.
            - generic [ref=e353]:
              - generic [ref=e354]: 1,240
              - generic [ref=e355]: signatures
              - generic [ref=e356]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e357] [cursor=pointer]:
          - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e359]
          - generic [ref=e360]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e361]
            - paragraph [ref=e362]: Thousands cannot safely commute when rains begin.
            - generic [ref=e363]:
              - generic [ref=e364]: 1,240
              - generic [ref=e365]: signatures
              - generic [ref=e366]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e367] [cursor=pointer]:
          - /url: /petitions/cmp0b5n8n000217o87ajqu66o
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e369]
          - generic [ref=e370]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e371]
            - paragraph [ref=e372]: Thousands cannot safely commute when rains begin.
            - generic [ref=e373]:
              - generic [ref=e374]: 1,240
              - generic [ref=e375]: signatures
              - generic [ref=e376]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e377] [cursor=pointer]:
          - /url: /petitions/cmp054xje00021zshki4laxca
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e379]
          - generic [ref=e380]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e381]
            - paragraph [ref=e382]: Thousands cannot safely commute when rains begin.
            - generic [ref=e383]:
              - generic [ref=e384]: 1,240
              - generic [ref=e385]: signatures
              - generic [ref=e386]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e387] [cursor=pointer]:
          - /url: /petitions/cmovbbvp60002282k7bxyyl43
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e389]
          - generic [ref=e390]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e391]
            - paragraph [ref=e392]: Thousands cannot safely commute when rains begin.
            - generic [ref=e393]:
              - generic [ref=e394]: 1,240
              - generic [ref=e395]: signatures
              - generic [ref=e396]: Growing today
    - generic [ref=e400]:
      - generic [ref=e401]:
        - paragraph [ref=e402]: Support the platform
        - heading "Help keep Change Liberia free and independent" [level=2] [ref=e403]
        - paragraph [ref=e404]: Change Liberia is a non-partisan civic platform built to give every Liberian a verified voice. Your donation funds the infrastructure that connects citizens with decision-makers — from Monrovia to the most rural counties.
        - list [ref=e405]:
          - listitem [ref=e406]:
            - generic [ref=e407]: 🔒
            - generic [ref=e408]:
              - paragraph [ref=e409]: Fraud-resistant signatures
              - paragraph [ref=e410]: Every signature is verified to protect petition integrity.
          - listitem [ref=e411]:
            - generic [ref=e412]: 📡
            - generic [ref=e413]:
              - paragraph [ref=e414]: Real-time transparency
              - paragraph [ref=e415]: Live signature counts show the true weight of public support.
          - listitem [ref=e416]:
            - generic [ref=e417]: 🌍
            - generic [ref=e418]:
              - paragraph [ref=e419]: Built for Liberia
              - paragraph [ref=e420]: Local language support, low-bandwidth optimised, and mobile-first.
      - generic [ref=e422]:
        - generic [ref=e423]:
          - heading "Support This Campaign" [level=3] [ref=e424]
          - paragraph [ref=e425]: Help keep Change Liberia free and independent
        - generic [ref=e426]:
          - paragraph [ref=e427]: "Select an amount:"
          - generic [ref=e428]:
            - button "$5" [ref=e429]
            - button "$10" [ref=e430]
            - button "$25" [ref=e431]
            - button "$50" [ref=e432]
            - button "$100" [ref=e433]
          - generic [ref=e434]:
            - generic [ref=e435]: $
            - spinbutton [ref=e436]
        - button "💝 Make a Donation" [ref=e437]
    - generic [ref=e442]:
      - generic [ref=e443]:
        - paragraph [ref=e444]: Your voice matters
        - heading "We help you shape a clear petition" [level=2] [ref=e445]
        - paragraph [ref=e446]: A few sentences about a problem in your community are enough to start. Add details, photos, and updates as your campaign grows — from Gbarnga to Harper.
        - link "Start your petition →" [ref=e447] [cursor=pointer]:
          - /url: /create
      - generic [ref=e448]:
        - generic [ref=e449]:
          - generic [ref=e450]: ⚡
          - paragraph [ref=e451]: Start in under 3 minutes
        - generic [ref=e452]:
          - generic [ref=e453]: 🔒
          - paragraph [ref=e454]: Verified signatures only
        - generic [ref=e455]:
          - generic [ref=e456]: 📍
          - paragraph [ref=e457]: Reach the right Liberian leaders
        - paragraph [ref=e458]: Free to create. No account needed to browse.
    - generic [ref=e461]:
      - paragraph [ref=e462]: For every Liberian
      - heading "Ready to make change happen?" [level=2] [ref=e463]
      - paragraph [ref=e464]: Change Liberia is built for transparency and trust. From ward to Capitol Hill, your petition keeps leaders accountable and gives every Liberian a verified voice.
      - generic [ref=e465]:
        - link "Start a petition — it's free" [ref=e466] [cursor=pointer]:
          - /url: /create
        - link "Browse petitions" [ref=e467] [cursor=pointer]:
          - /url: /petitions
    - generic [ref=e470]:
      - generic [ref=e471]:
        - generic [ref=e472]:
          - link "Change Liberia" [ref=e473] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e474]
          - paragraph [ref=e475]: Empowering every Liberian to raise issues, gather trusted support, and drive real civic change — from Monrovia to the countryside.
          - generic [ref=e476]:
            - link "Facebook" [ref=e477] [cursor=pointer]:
              - /url: "#"
              - img [ref=e478]
            - link "X (Twitter)" [ref=e480] [cursor=pointer]:
              - /url: "#"
              - img [ref=e481]
        - generic [ref=e483]:
          - heading "Get involved" [level=3] [ref=e484]
          - list [ref=e485]:
            - listitem [ref=e486]:
              - link "Start a petition" [ref=e487] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e488]:
              - link "Browse by topic" [ref=e489] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e490]:
              - link "Search petitions" [ref=e491] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e492]:
              - link "Become a Change Leader 🇱🇷" [ref=e493] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e494]:
              - link "Join the Movement" [ref=e495] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e496]:
              - link "How It Works" [ref=e497] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e498]:
              - link "Become a Voice for Change" [ref=e499] [cursor=pointer]:
                - /url: /apply
        - generic [ref=e500]:
          - heading "Learn" [level=3] [ref=e501]
          - list [ref=e502]:
            - listitem [ref=e503]:
              - link "How it works" [ref=e504] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e505]:
              - link "Create your petition" [ref=e506] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e507]:
              - link "Collect signatures" [ref=e508] [cursor=pointer]:
                - /url: /collect-signatures
        - generic [ref=e509]:
          - heading "About" [level=3] [ref=e510]
          - list [ref=e511]:
            - listitem [ref=e512]:
              - link "Home" [ref=e513] [cursor=pointer]:
                - /url: /
            - listitem [ref=e514]:
              - link "About us" [ref=e515] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e516]:
              - link "Dashboard" [ref=e517] [cursor=pointer]:
                - /url: /dashboard
        - generic [ref=e518]:
          - heading "Help & legal" [level=3] [ref=e519]
          - list [ref=e520]:
            - listitem [ref=e521]:
              - link "Help center" [ref=e522] [cursor=pointer]:
                - /url: /help-center
            - listitem [ref=e523]:
              - link "Community guidelines" [ref=e524] [cursor=pointer]:
                - /url: /community-guidelines
            - listitem [ref=e525]:
              - link "Privacy policy" [ref=e526] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e527]:
              - link "Terms of service" [ref=e528] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e529]:
        - paragraph [ref=e530]: © 2026 Change Liberia. Built for the people of Liberia.
        - generic [ref=e531]:
          - link "Privacy" [ref=e532] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e533] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e534]: English (Liberia)
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
> 57  |     if (await customInput.isVisible()) {
      |                           ^ Error: locator.isVisible: Unexpected token "|" while parsing css selector "input[name="customAmount"]|input[type="number"][name*="amount"]". Did you mean to CSS.escape it?
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
```
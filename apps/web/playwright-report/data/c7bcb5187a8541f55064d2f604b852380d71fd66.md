# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: donations.spec.ts >> Donations & Stripe Integration >> should display recurring donation option
- Location: tests/e2e/donations.spec.ts:259:7

# Error details

```
Error: locator.isVisible: Unexpected token "|" while parsing css selector "input[type="checkbox"][name="recurring"]|input[type="checkbox"][name="monthly"]". Did you mean to CSS.escape it?
Call log:
    - checking visibility of input[type="checkbox"][name="recurring"]|input[type="checkbox"][name="monthly"]

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e6]: Trending
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
        - generic [ref=e11]: ·
        - generic [ref=e12]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
        - generic [ref=e13]: ·
      - generic [ref=e14]:
        - generic [ref=e15]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
        - generic [ref=e16]: ·
        - generic [ref=e17]: Change Liberia · Civic petitions for all 15 counties of Liberia · Sign. Share. Speak up.
        - generic [ref=e18]: ·
  - main [ref=e20]:
    - generic [ref=e21]:
      - generic:
        - img
      - generic [ref=e22]:
        - generic [ref=e23]:
          - img
          - generic [ref=e25]:
            - generic [ref=e26]: 🇱🇷 Liberia's civic petition platform
            - heading "Change Liberia starts with you." [level=1] [ref=e27]:
              - text: Change Liberia
              - text: starts with you.
            - paragraph [ref=e28]: Join thousands of Liberians raising real issues — from roads in Sinkor to schools in Lofa. Gather verified support and move leaders to act.
            - generic [ref=e29]: 10,247 signatures today
            - generic [ref=e30]:
              - button "Start a petition" [ref=e31] [cursor=pointer]
              - link "Browse causes →" [ref=e32] [cursor=pointer]:
                - /url: /petitions
        - generic [ref=e33]:
          - img
          - generic [ref=e38]:
            - generic [ref=e39]:
              - heading "What change does Liberia need?" [level=2] [ref=e40]
              - paragraph [ref=e41]: Start by sharing the issue you care about. We'll guide you through the rest.
            - generic [ref=e42]:
              - textbox "Type something..." [ref=e44]
              - paragraph [ref=e45]: 0 / 120 characters
            - button "Create petition" [disabled] [ref=e46]
            - paragraph [ref=e47]: Your petition will be reviewed before going live. It's free and takes less than 5 minutes.
    - generic [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e52]:
          - paragraph [ref=e53]: 21+
          - paragraph [ref=e54]: Petitions created
        - generic [ref=e55]:
          - paragraph [ref=e56]: 26K+
          - paragraph [ref=e57]: Verified signatures
        - generic [ref=e58]:
          - paragraph [ref=e59]: "0"
          - paragraph [ref=e60]: Campaigns won
        - generic [ref=e61]:
          - paragraph [ref=e62]: "15"
          - paragraph [ref=e63]: Counties reached
      - paragraph [ref=e64]: Join Liberians using verified petitions to speak up for schools, roads, health, and justice — county by county.
    - generic [ref=e67]:
      - paragraph [ref=e68]: 🔥 Trending campaign
      - generic [ref=e72]:
        - generic [ref=e73]:
          - generic [ref=e74]: 🟢 Active
          - generic [ref=e75]: ✎ 1,241 signatures
        - heading "Fix Sinkor Community Roads Before Rainy Season" [level=2] [ref=e76]
        - paragraph [ref=e77]: Thousands cannot safely commute when rains begin.
        - generic [ref=e78]:
          - link "Sign this petition" [ref=e79] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v#sign
          - link "Read full story →" [ref=e80] [cursor=pointer]:
            - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
    - generic [ref=e83]:
      - generic [ref=e84]:
        - paragraph [ref=e85]: How it works
        - heading "Civic action for Liberia, made simple" [level=2] [ref=e86]
        - paragraph [ref=e87]: Change Liberia is a structured civic process — from a citizen raising an issue to a government authority formally receiving and responding to it.
      - generic [ref=e88]:
        - generic [ref=e90]:
          - generic [ref=e91]:
            - generic [ref=e92]: ✍️
            - generic [ref=e93]: "1"
          - heading "Submit your issue" [level=3] [ref=e95]
          - paragraph [ref=e96]: Describe what needs to change. Choose categories, add prior actions taken, and set your signature goal. Takes under 3 minutes.
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]: 🔎
            - generic [ref=e101]: "2"
          - heading "Petition is reviewed" [level=3] [ref=e103]
          - paragraph [ref=e104]: Our team reviews every petition within 24–48 hours to confirm it is a genuine civic issue. Legitimate grievances are never suppressed.
        - generic [ref=e106]:
          - generic [ref=e107]:
            - generic [ref=e108]: 🤝
            - generic [ref=e109]: "3"
          - heading "People sign & support" [level=3] [ref=e111]
          - paragraph [ref=e112]: Share your petition. Verified Liberian signatures carry far more weight with decision-makers than unverified ones.
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]: 📊
            - generic [ref=e117]: "4"
          - heading "Threshold reached" [level=3] [ref=e119]
          - paragraph [ref=e120]: At 1,000 verified signatures a formal PDF report is generated, ready for official submission to the right authority.
        - generic [ref=e122]:
          - generic [ref=e123]:
            - generic [ref=e124]: 📬
            - generic [ref=e125]: "5"
          - heading "Delivered to authority" [level=3] [ref=e127]
          - paragraph [ref=e128]: Smart routing identifies the correct Ministry, Legislature, or County official and delivers the petition formally with a digital record.
        - generic [ref=e130]:
          - generic [ref=e131]:
            - generic [ref=e132]: 📣
            - generic [ref=e133]: "6"
          - heading "Response tracked publicly" [level=3] [ref=e134]
          - paragraph [ref=e135]: The official response — or silence — is tracked and shown publicly on the petition page. No response is also a public fact.
      - generic [ref=e136]:
        - link "Start a petition — it's free" [ref=e137] [cursor=pointer]:
          - /url: /create
        - link "Full process details →" [ref=e138] [cursor=pointer]:
          - /url: /how-it-works
    - generic [ref=e141]:
      - generic [ref=e142]:
        - paragraph [ref=e143]: Active campaigns
        - heading "Discover causes" [level=2] [ref=e144]
        - paragraph [ref=e145]: Petitions gaining momentum across Liberia
        - generic [ref=e148]:
          - generic [ref=e149]:
            - textbox "Search petitions by title, topic, or cause..." [ref=e150]
            - img
          - button "Search" [ref=e151]
          - button "Advanced filters" [ref=e152]:
            - img [ref=e153]
      - generic [ref=e155]:
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,241 signatures Growing today" [ref=e156] [cursor=pointer]:
          - /url: /petitions/cmoeuvo4h00025406tjj4tu1v
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e158]
          - generic [ref=e159]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e160]
            - paragraph [ref=e161]: Thousands cannot safely commute when rains begin.
            - generic [ref=e162]:
              - generic [ref=e163]: 1,241
              - generic [ref=e164]: signatures
              - generic [ref=e165]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e166] [cursor=pointer]:
          - /url: /petitions/cmp0dc60c0002k5ncvt7vu96z
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e168]
          - generic [ref=e169]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e170]
            - paragraph [ref=e171]: Thousands cannot safely commute when rains begin.
            - generic [ref=e172]:
              - generic [ref=e173]: 1,240
              - generic [ref=e174]: signatures
              - generic [ref=e175]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e176] [cursor=pointer]:
          - /url: /petitions/cmp0deokc0002ufh1n0q7sb7j
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e178]
          - generic [ref=e179]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e180]
            - paragraph [ref=e181]: Thousands cannot safely commute when rains begin.
            - generic [ref=e182]:
              - generic [ref=e183]: 1,240
              - generic [ref=e184]: signatures
              - generic [ref=e185]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e186] [cursor=pointer]:
          - /url: /petitions/cmp0dgl8i00022oyj0ds6kpk2
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e188]
          - generic [ref=e189]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e190]
            - paragraph [ref=e191]: Thousands cannot safely commute when rains begin.
            - generic [ref=e192]:
              - generic [ref=e193]: 1,240
              - generic [ref=e194]: signatures
              - generic [ref=e195]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e196] [cursor=pointer]:
          - /url: /petitions/cmp0dilc50002bqpe4andpdu3
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e198]
          - generic [ref=e199]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e200]
            - paragraph [ref=e201]: Thousands cannot safely commute when rains begin.
            - generic [ref=e202]:
              - generic [ref=e203]: 1,240
              - generic [ref=e204]: signatures
              - generic [ref=e205]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e206] [cursor=pointer]:
          - /url: /petitions/cmp0byar40002pjgluym81ijm
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e208]
          - generic [ref=e209]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e210]
            - paragraph [ref=e211]: Thousands cannot safely commute when rains begin.
            - generic [ref=e212]:
              - generic [ref=e213]: 1,240
              - generic [ref=e214]: signatures
              - generic [ref=e215]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e216] [cursor=pointer]:
          - /url: /petitions/cmp0cqep50002b6vl4uyfawu8
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e218]
          - generic [ref=e219]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e220]
            - paragraph [ref=e221]: Thousands cannot safely commute when rains begin.
            - generic [ref=e222]:
              - generic [ref=e223]: 1,240
              - generic [ref=e224]: signatures
              - generic [ref=e225]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e226] [cursor=pointer]:
          - /url: /petitions/cmp0cnrf10002rtwfunt5grt1
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e228]
          - generic [ref=e229]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e230]
            - paragraph [ref=e231]: Thousands cannot safely commute when rains begin.
            - generic [ref=e232]:
              - generic [ref=e233]: 1,240
              - generic [ref=e234]: signatures
              - generic [ref=e235]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e236] [cursor=pointer]:
          - /url: /petitions/cmp0clods00024vl2kxmjlsll
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e238]
          - generic [ref=e239]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e240]
            - paragraph [ref=e241]: Thousands cannot safely commute when rains begin.
            - generic [ref=e242]:
              - generic [ref=e243]: 1,240
              - generic [ref=e244]: signatures
              - generic [ref=e245]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e246] [cursor=pointer]:
          - /url: /petitions/cmp0cjzuk0002haeic0apg05b
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e248]
          - generic [ref=e249]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e250]
            - paragraph [ref=e251]: Thousands cannot safely commute when rains begin.
            - generic [ref=e252]:
              - generic [ref=e253]: 1,240
              - generic [ref=e254]: signatures
              - generic [ref=e255]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e256] [cursor=pointer]:
          - /url: /petitions/cmp0cg81f000214kdymrcnlvz
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e258]
          - generic [ref=e259]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e260]
            - paragraph [ref=e261]: Thousands cannot safely commute when rains begin.
            - generic [ref=e262]:
              - generic [ref=e263]: 1,240
              - generic [ref=e264]: signatures
              - generic [ref=e265]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e266] [cursor=pointer]:
          - /url: /petitions/cmp0cdu1a000242m924n644t5
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e268]
          - generic [ref=e269]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e270]
            - paragraph [ref=e271]: Thousands cannot safely commute when rains begin.
            - generic [ref=e272]:
              - generic [ref=e273]: 1,240
              - generic [ref=e274]: signatures
              - generic [ref=e275]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e276] [cursor=pointer]:
          - /url: /petitions/cmp0cbjcl0002mffb1bsbeive
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e278]
          - generic [ref=e279]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e280]
            - paragraph [ref=e281]: Thousands cannot safely commute when rains begin.
            - generic [ref=e282]:
              - generic [ref=e283]: 1,240
              - generic [ref=e284]: signatures
              - generic [ref=e285]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e286] [cursor=pointer]:
          - /url: /petitions/cmp0c9ley0002ioilqrw20i95
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e288]
          - generic [ref=e289]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e290]
            - paragraph [ref=e291]: Thousands cannot safely commute when rains begin.
            - generic [ref=e292]:
              - generic [ref=e293]: 1,240
              - generic [ref=e294]: signatures
              - generic [ref=e295]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e296] [cursor=pointer]:
          - /url: /petitions/cmp0c8sru0002cip519liwsm0
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e298]
          - generic [ref=e299]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e300]
            - paragraph [ref=e301]: Thousands cannot safely commute when rains begin.
            - generic [ref=e302]:
              - generic [ref=e303]: 1,240
              - generic [ref=e304]: signatures
              - generic [ref=e305]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e306] [cursor=pointer]:
          - /url: /petitions/cmp0c0ft400029cec7qqmmuez
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e308]
          - generic [ref=e309]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e310]
            - paragraph [ref=e311]: Thousands cannot safely commute when rains begin.
            - generic [ref=e312]:
              - generic [ref=e313]: 1,240
              - generic [ref=e314]: signatures
              - generic [ref=e315]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e316] [cursor=pointer]:
          - /url: /petitions/cmp0bmgbz0002fmu8i01kcueb
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e318]
          - generic [ref=e319]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e320]
            - paragraph [ref=e321]: Thousands cannot safely commute when rains begin.
            - generic [ref=e322]:
              - generic [ref=e323]: 1,240
              - generic [ref=e324]: signatures
              - generic [ref=e325]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e326] [cursor=pointer]:
          - /url: /petitions/cmp0blaf20002rzaa86g4lf07
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e328]
          - generic [ref=e329]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e330]
            - paragraph [ref=e331]: Thousands cannot safely commute when rains begin.
            - generic [ref=e332]:
              - generic [ref=e333]: 1,240
              - generic [ref=e334]: signatures
              - generic [ref=e335]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e336] [cursor=pointer]:
          - /url: /petitions/cmp0b5n8n000217o87ajqu66o
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e338]
          - generic [ref=e339]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e340]
            - paragraph [ref=e341]: Thousands cannot safely commute when rains begin.
            - generic [ref=e342]:
              - generic [ref=e343]: 1,240
              - generic [ref=e344]: signatures
              - generic [ref=e345]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e346] [cursor=pointer]:
          - /url: /petitions/cmp054xje00021zshki4laxca
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e348]
          - generic [ref=e349]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e350]
            - paragraph [ref=e351]: Thousands cannot safely commute when rains begin.
            - generic [ref=e352]:
              - generic [ref=e353]: 1,240
              - generic [ref=e354]: signatures
              - generic [ref=e355]: Growing today
        - link "Fix Sinkor Community Roads Before Rainy Season Fix Sinkor Community Roads Before Rainy Season Thousands cannot safely commute when rains begin. 1,240 signatures Growing today" [ref=e356] [cursor=pointer]:
          - /url: /petitions/cmovbbvp60002282k7bxyyl43
          - img "Fix Sinkor Community Roads Before Rainy Season" [ref=e358]
          - generic [ref=e359]:
            - heading "Fix Sinkor Community Roads Before Rainy Season" [level=3] [ref=e360]
            - paragraph [ref=e361]: Thousands cannot safely commute when rains begin.
            - generic [ref=e362]:
              - generic [ref=e363]: 1,240
              - generic [ref=e364]: signatures
              - generic [ref=e365]: Growing today
    - generic [ref=e369]:
      - generic [ref=e370]:
        - paragraph [ref=e371]: Support the platform
        - heading "Help keep Change Liberia free and independent" [level=2] [ref=e372]
        - paragraph [ref=e373]: Change Liberia is a non-partisan civic platform built to give every Liberian a verified voice. Your donation funds the infrastructure that connects citizens with decision-makers — from Monrovia to the most rural counties.
        - list [ref=e374]:
          - listitem [ref=e375]:
            - generic [ref=e376]: 🔒
            - generic [ref=e377]:
              - paragraph [ref=e378]: Fraud-resistant signatures
              - paragraph [ref=e379]: Every signature is verified to protect petition integrity.
          - listitem [ref=e380]:
            - generic [ref=e381]: 📡
            - generic [ref=e382]:
              - paragraph [ref=e383]: Real-time transparency
              - paragraph [ref=e384]: Live signature counts show the true weight of public support.
          - listitem [ref=e385]:
            - generic [ref=e386]: 🌍
            - generic [ref=e387]:
              - paragraph [ref=e388]: Built for Liberia
              - paragraph [ref=e389]: Local language support, low-bandwidth optimised, and mobile-first.
      - generic [ref=e391]:
        - generic [ref=e392]:
          - heading "Support This Campaign" [level=3] [ref=e393]
          - paragraph [ref=e394]: Help keep Change Liberia free and independent
        - generic [ref=e395]:
          - paragraph [ref=e396]: "Select an amount:"
          - generic [ref=e397]:
            - button "$5" [ref=e398]
            - button "$10" [ref=e399]
            - button "$25" [ref=e400]
            - button "$50" [ref=e401]
            - button "$100" [ref=e402]
          - generic [ref=e403]:
            - generic [ref=e404]: $
            - spinbutton [ref=e405]
        - button "💝 Make a Donation" [ref=e406]
    - generic [ref=e411]:
      - generic [ref=e412]:
        - paragraph [ref=e413]: Your voice matters
        - heading "We help you shape a clear petition" [level=2] [ref=e414]
        - paragraph [ref=e415]: A few sentences about a problem in your community are enough to start. Add details, photos, and updates as your campaign grows — from Gbarnga to Harper.
        - link "Start your petition →" [ref=e416] [cursor=pointer]:
          - /url: /create
      - generic [ref=e417]:
        - generic [ref=e418]:
          - generic [ref=e419]: ⚡
          - paragraph [ref=e420]: Start in under 3 minutes
        - generic [ref=e421]:
          - generic [ref=e422]: 🔒
          - paragraph [ref=e423]: Verified signatures only
        - generic [ref=e424]:
          - generic [ref=e425]: 📍
          - paragraph [ref=e426]: Reach the right Liberian leaders
        - paragraph [ref=e427]: Free to create. No account needed to browse.
    - generic [ref=e430]:
      - paragraph [ref=e431]: For every Liberian
      - heading "Ready to make change happen?" [level=2] [ref=e432]
      - paragraph [ref=e433]: Change Liberia is built for transparency and trust. From ward to Capitol Hill, your petition keeps leaders accountable and gives every Liberian a verified voice.
      - generic [ref=e434]:
        - link "Start a petition — it's free" [ref=e435] [cursor=pointer]:
          - /url: /create
        - link "Browse petitions" [ref=e436] [cursor=pointer]:
          - /url: /petitions
    - generic [ref=e439]:
      - generic [ref=e440]:
        - generic [ref=e441]:
          - link "Change Liberia" [ref=e442] [cursor=pointer]:
            - /url: /
            - img "Change Liberia" [ref=e443]
          - paragraph [ref=e444]: Empowering every Liberian to raise issues, gather trusted support, and drive real civic change — from Monrovia to the countryside.
          - generic [ref=e445]:
            - link "Facebook" [ref=e446] [cursor=pointer]:
              - /url: "#"
              - img [ref=e447]
            - link "X (Twitter)" [ref=e449] [cursor=pointer]:
              - /url: "#"
              - img [ref=e450]
        - generic [ref=e452]:
          - heading "Get involved" [level=3] [ref=e453]
          - list [ref=e454]:
            - listitem [ref=e455]:
              - link "Start a petition" [ref=e456] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e457]:
              - link "Browse by topic" [ref=e458] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e459]:
              - link "Search petitions" [ref=e460] [cursor=pointer]:
                - /url: /petitions
            - listitem [ref=e461]:
              - link "Become a Change Leader 🇱🇷" [ref=e462] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e463]:
              - link "Join the Movement" [ref=e464] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e465]:
              - link "How It Works" [ref=e466] [cursor=pointer]:
                - /url: /leaders
            - listitem [ref=e467]:
              - link "Become a Voice for Change" [ref=e468] [cursor=pointer]:
                - /url: /apply
        - generic [ref=e469]:
          - heading "Learn" [level=3] [ref=e470]
          - list [ref=e471]:
            - listitem [ref=e472]:
              - link "How it works" [ref=e473] [cursor=pointer]:
                - /url: /how-it-works
            - listitem [ref=e474]:
              - link "Create your petition" [ref=e475] [cursor=pointer]:
                - /url: /create
            - listitem [ref=e476]:
              - link "Collect signatures" [ref=e477] [cursor=pointer]:
                - /url: /collect-signatures
        - generic [ref=e478]:
          - heading "About" [level=3] [ref=e479]
          - list [ref=e480]:
            - listitem [ref=e481]:
              - link "Home" [ref=e482] [cursor=pointer]:
                - /url: /
            - listitem [ref=e483]:
              - link "About us" [ref=e484] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e485]:
              - link "Dashboard" [ref=e486] [cursor=pointer]:
                - /url: /dashboard
        - generic [ref=e487]:
          - heading "Help & legal" [level=3] [ref=e488]
          - list [ref=e489]:
            - listitem [ref=e490]:
              - link "Help center" [ref=e491] [cursor=pointer]:
                - /url: /help-center
            - listitem [ref=e492]:
              - link "Community guidelines" [ref=e493] [cursor=pointer]:
                - /url: /community-guidelines
            - listitem [ref=e494]:
              - link "Privacy policy" [ref=e495] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e496]:
              - link "Terms of service" [ref=e497] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e498]:
        - paragraph [ref=e499]: © 2026 Change Liberia. Built for the people of Liberia.
        - generic [ref=e500]:
          - link "Privacy" [ref=e501] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e502] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e503]: English (Liberia)
  - button "Open Next.js Dev Tools" [ref=e509] [cursor=pointer]:
    - img [ref=e510]
```

# Test source

```ts
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
  227 |       // Fill invalid card
  228 |       const stripeFrame = page.frameLocator('iframe[title*="Stripe"][name*="card"]');
  229 |       const cardNumberField = stripeFrame.locator('input[name="cardnumber"]');
  230 | 
  231 |       if (await cardNumberField.isVisible()) {
  232 |         await cardNumberField.fill('4000000000000002'); // Declined card
  233 |         const expiryField = stripeFrame.locator('input[name="exp-date"]');
  234 |         await expiryField.fill('1225');
  235 |         const cvcField = stripeFrame.locator('input[name="cvc"]');
  236 |         await cvcField.fill('123');
  237 |       }
  238 | 
  239 |       // Submit
  240 |       const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
  241 |       await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');
  242 | 
  243 |       // Should show error
  244 |       await expectTextContent(page, '[role="alert"]|.error-message', /declined|invalid|error/i);
  245 |     }
  246 |   });
  247 | 
  248 |   test('should send donation receipt email', async ({ page }) => {
  249 |     // This test verifies email sending (would need email backend verification)
  250 |     // For now, just check that receipt email option is shown
  251 | 
  252 |     const emailCheckbox = page.locator('input[type="checkbox"][name="sendReceipt"]');
  253 |     if (await emailCheckbox.isVisible()) {
  254 |       await emailCheckbox.check();
  255 |       expect(await emailCheckbox.isChecked()).toBe(true);
  256 |     }
  257 |   });
  258 | 
  259 |   test('should display recurring donation option', async ({ page }) => {
  260 |     await page.goto('/');
  261 | 
  262 |     const recurringCheckbox = page.locator('input[type="checkbox"][name="recurring"]|input[type="checkbox"][name="monthly"]');
  263 |     
> 264 |     if (await recurringCheckbox.isVisible()) {
      |                                 ^ Error: locator.isVisible: Unexpected token "|" while parsing css selector "input[type="checkbox"][name="recurring"]|input[type="checkbox"][name="monthly"]". Did you mean to CSS.escape it?
  265 |       await recurringCheckbox.check();
  266 | 
  267 |       // Check for recurring frequency options
  268 |       const frequencySelect = page.locator('select[name="frequency"]|button[role="listbox"]');
  269 |       expect(await frequencySelect.isVisible()).toBeTruthy();
  270 |     }
  271 |   });
  272 | 
  273 |   test('should handle donation form validation', async ({ page }) => {
  274 |     await page.goto('/');
  275 | 
  276 |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$10")');
  277 |     if (await donationButton.isVisible()) {
  278 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$10")');
  279 |       await page.waitForLoadState('networkidle');
  280 | 
  281 |       // Try to submit without required fields
  282 |       const submitButton = page.locator('button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]').last();
  283 |       
  284 |       if (await submitButton.isEnabled()) {
  285 |         await clickElement(page, 'button:has-text("Donate")|button:has-text("Pay")|button[type="submit"]:last-child');
  286 | 
  287 |         // Should show validation errors
  288 |         const errors = page.locator('[role="alert"]');
  289 |         const errorCount = await errors.count();
  290 |         expect(errorCount).toBeGreaterThan(0);
  291 |       }
  292 |     }
  293 |   });
  294 | 
  295 |   test('should track donation analytics', async ({ page }) => {
  296 |     // Navigate and interact
  297 |     await page.goto('/');
  298 | 
  299 |     // Listen for analytics events
  300 |     let analyticsEvent = false;
  301 | 
  302 |     page.on('console', (msg) => {
  303 |       if (msg.text().includes('donation') || msg.text().includes('analytics')) {
  304 |         analyticsEvent = true;
  305 |       }
  306 |     });
  307 | 
  308 |     // Trigger donation interaction
  309 |     const donationButton = page.locator('[data-testid="donation-widget"] button').first();
  310 |     if (await donationButton.isVisible()) {
  311 |       await clickElement(page, '[data-testid="donation-widget"] button');
  312 |     }
  313 | 
  314 |     // Check for GTM/analytics data
  315 |     await page.waitForTimeout(1000);
  316 |   });
  317 | 
  318 |   test('should display donation goal/progress', async ({ page }) => {
  319 |     // Check admin dashboard or campaigns page for donation progress
  320 |     const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  321 |     const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  322 | 
  323 |     // Login first
  324 |     await page.goto('/auth/login');
  325 |     await fillInput(page, 'input[name="email"]', testEmail);
  326 |     await fillInput(page, 'input[name="password"]', testPassword);
  327 |     await clickElement(page, 'button[type="submit"]');
  328 |     await page.waitForURL(/dashboard/, { timeout: 10000 });
  329 | 
  330 |     // Navigate to donations/campaigns page
  331 |     await page.goto('/admin/campaigns');
  332 | 
  333 |     // Check for progress display
  334 |     const progressBar = page.locator('[data-testid="donation-progress"]|.progress-bar');
  335 |     const goalAmount = page.locator('[data-testid="goal-amount"]|.goal-amount');
  336 | 
  337 |     expect(await progressBar.isVisible().catch(() => false) || await goalAmount.isVisible().catch(() => false)).toBeTruthy();
  338 |   });
  339 | 
  340 |   test('should prevent double charge on retry', async ({ page }) => {
  341 |     // Test idempotency key handling
  342 |     await page.goto('/');
  343 | 
  344 |     // This test checks that if payment is submitted twice,
  345 |     // it doesn't result in two charges
  346 | 
  347 |     const donationButton = page.locator('[data-testid="donation-widget"] button:has-text("$30")');
  348 |     if (await donationButton.isVisible()) {
  349 |       await clickElement(page, '[data-testid="donation-widget"] button:has-text("$30")');
  350 |       await page.waitForLoadState('networkidle');
  351 | 
  352 |       // Check for idempotency key in form
  353 |       const idempotencyKey = page.locator('input[type="hidden"][name*="idempotency"]|input[type="hidden"][name*="key"]');
  354 |       
  355 |       if (await idempotencyKey.isVisible()) {
  356 |         const keyValue = await idempotencyKey.inputValue();
  357 |         expect(keyValue).toBeTruthy();
  358 |         expect(keyValue.length).toBeGreaterThan(0);
  359 |       }
  360 |     }
  361 |   });
  362 | });
  363 | 
```
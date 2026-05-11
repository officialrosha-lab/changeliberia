# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: donations.spec.ts >> Donations & Stripe Integration >> should display donation goal/progress
- Location: tests/e2e/donations.spec.ts:318:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]') to be visible

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
    - main [ref=e123]:
      - generic [ref=e125]:
        - generic [ref=e127]:
          - generic [ref=e128]:
            - button "Phone + OTP" [ref=e129]
            - button "Email + Password" [ref=e130]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - link "Change Liberia Change Liberia" [ref=e134] [cursor=pointer]:
                - /url: /
                - img "Change Liberia" [ref=e135]
                - generic [ref=e136]: Change Liberia
              - generic [ref=e137]: /
              - generic [ref=e138]: Log in
            - paragraph [ref=e139]: Welcome back
            - heading "Log in to your account" [level=1] [ref=e140]
            - paragraph [ref=e141]: Manage petitions, publish updates, and track your campaign progress.
            - generic [ref=e142]:
              - generic [ref=e143]:
                - generic [ref=e144]: Phone number
                - textbox "Phone number" [ref=e145]:
                  - /placeholder: +231 770 000 000
              - button "Continue" [ref=e146]
            - paragraph [ref=e147]:
              - text: New here?
              - link "Create an account" [ref=e148] [cursor=pointer]:
                - /url: /auth/signup
          - generic [ref=e150]:
            - generic [ref=e152]: or
            - generic [ref=e155]:
              - button "Sign in with Google. Opens in new tab" [ref=e157] [cursor=pointer]:
                - generic [ref=e159]:
                  - img [ref=e161]
                  - generic [ref=e168]: Sign in with Google
              - iframe
        - complementary [ref=e169]:
          - img
          - generic [ref=e170]:
            - generic [ref=e171]:
              - paragraph [ref=e172]: Your account
              - heading "Why sign in?" [level=2] [ref=e173]
            - list [ref=e174]:
              - listitem [ref=e175]:
                - generic [ref=e176]: 📋
                - paragraph [ref=e177]: Manage your petitions and track which ones are pending review.
              - listitem [ref=e178]:
                - generic [ref=e179]: 📢
                - paragraph [ref=e180]: Publish updates to supporters as your campaign grows.
              - listitem [ref=e181]:
                - generic [ref=e182]: ✅
                - paragraph [ref=e183]: Build trust with phone, location, and ID verification.
            - paragraph [ref=e184]: Your account helps make petitions on this platform more credible and more useful to the people asked to respond.
```

# Test source

```ts
  1   | /**
  2   |  * E2E Test Helper Utilities
  3   |  * Reusable functions for common test operations
  4   |  */
  5   | 
  6   | import { Page, Locator, expect } from '@playwright/test';
  7   | 
  8   | /**
  9   |  * Wait for and click an element
  10  |  */
  11  | export async function clickElement(page: Page, selector: string | Locator, timeout = 5000) {
  12  |   if (typeof selector === 'string') {
  13  |     await page.waitForSelector(selector, { timeout });
  14  |     await page.click(selector);
  15  |   } else {
  16  |     await selector.click({ timeout });
  17  |   }
  18  | }
  19  | 
  20  | /**
  21  |  * Wait for and fill an input field
  22  |  */
  23  | export async function fillInput(page: Page, selector: string, value: string, timeout = 5000) {
> 24  |   await page.waitForSelector(selector, { timeout });
      |              ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  25  |   await page.fill(selector, value);
  26  | }
  27  | 
  28  | /**
  29  |  * Wait for and get text content
  30  |  */
  31  | export async function getText(page: Page, selector: string, timeout = 5000): Promise<string> {
  32  |   await page.waitForSelector(selector, { timeout });
  33  |   const text = await page.textContent(selector);
  34  |   return text || '';
  35  | }
  36  | 
  37  | /**
  38  |  * Fill form with multiple fields
  39  |  */
  40  | export async function fillForm(
  41  |   page: Page,
  42  |   fields: Record<string, string>,
  43  |   timeout = 5000
  44  | ) {
  45  |   for (const [selector, value] of Object.entries(fields)) {
  46  |     await fillInput(page, selector, value, timeout);
  47  |   }
  48  | }
  49  | 
  50  | /**
  51  |  * Wait for and check element visibility
  52  |  */
  53  | export async function isVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  54  |   try {
  55  |     await page.waitForSelector(selector, { timeout });
  56  |     return page.isVisible(selector);
  57  |   } catch {
  58  |     return false;
  59  |   }
  60  | }
  61  | 
  62  | /**
  63  |  * Wait for navigation (useful after form submissions)
  64  |  */
  65  | export async function waitForNavigation(page: Page, action: () => Promise<void>, timeout = 30000) {
  66  |   await Promise.all([page.waitForNavigation({ timeout }), action()]);
  67  | }
  68  | 
  69  | /**
  70  |  * Check if element contains specific text (string or RegExp)
  71  |  */
  72  | export async function expectTextContent(
  73  |   page: Page,
  74  |   selector: string,
  75  |   expectedText: string | RegExp,
  76  |   timeout = 5000
  77  | ) {
  78  |   const element = page.locator(selector);
  79  |   if (typeof expectedText === 'string') {
  80  |     await expect(element).toContainText(expectedText, { timeout });
  81  |   } else {
  82  |     await expect(element).toContainText(expectedText, { timeout });
  83  |   }
  84  | }
  85  | 
  86  | /**
  87  |  * Wait for API response
  88  |  */
  89  | export async function waitForAPIResponse(
  90  |   page: Page,
  91  |   urlPattern: string | RegExp,
  92  |   action: () => Promise<void>,
  93  |   timeout = 30000
  94  | ) {
  95  |   const responsePromise = page.waitForResponse(
  96  |     (response) => {
  97  |       if (typeof urlPattern === 'string') {
  98  |         return response.url().includes(urlPattern);
  99  |       }
  100 |       return urlPattern.test(response.url());
  101 |     },
  102 |     { timeout }
  103 |   );
  104 | 
  105 |   await action();
  106 |   return responsePromise;
  107 | }
  108 | 
  109 | /**
  110 |  * Upload file to input
  111 |  */
  112 | export async function uploadFile(page: Page, selector: string, filePath: string) {
  113 |   const input = await page.$(selector);
  114 |   if (!input) throw new Error(`Element "${selector}" not found`);
  115 |   await input.setInputFiles(filePath);
  116 | }
  117 | 
  118 | /**
  119 |  * Clear and fill input (useful for clearing placeholders)
  120 |  */
  121 | export async function clearAndFill(page: Page, selector: string, value: string) {
  122 |   await page.locator(selector).clear();
  123 |   await page.locator(selector).fill(value);
  124 | }
```
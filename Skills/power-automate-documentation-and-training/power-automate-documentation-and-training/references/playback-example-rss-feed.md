# Example: playback dialog for a three-step RSS flow

A fictional three-step legacy package. "User" is the flow owner. Previews are shortened so this file carries no real values. The whole chat takes three turns.

---

**Copilot:** I read your export: a legacy package called "Harbor Cast RSS" with one cloud flow, "Harbor Cast". It has 3 steps: 1 trigger and 2 actions. Here is how I read it. Correct any part by number.

**1. The trigger.** The flow starts when a new item is published on an RSS feed (`https://***/.../rss`). It checks the feed every minute and uses **Split On** on the feed items, so three new episodes start three separate runs.

**2. The actions, in order.**
- **Step 2, Html to text** (Content Conversion): turns the episode's **Summary** from HTML into plain text.
- **Step 3, Create item** (SharePoint): creates one list item on a personal OneDrive site, filling **Title**, **Link**, **Summary** (from step 2) and **PublishedDate**. The export only has the list's ID, so tell me the list name.

**3. What I think it is for.** Goal: "Every new Harbor Cast episode lands as a clean list item in SharePoint." Audience: makers who want to copy this for their own feed.

**4. Things that usually trip people up here.**
1. **Polling and re-publishing.** A re-published episode can look new, and Create item has no duplicate check.
2. **HTML in the summary.** Without the conversion step, the Summary column shows raw tags.
3. **One run per episode.** Split On means no Apply to each loop is needed.

Is anything wrong or missing? Correct any part by number, and tell me anything you learned the hard way.

**User:** All right. The list is Harbor Cast Episodes. The duplicate thing bit me once.

**Copilot:** **5. What I will hide.**

| What | Real value (shortened) | Fictional value |
| --- | --- | --- |
| RSS feed URL | `https://***/.../rss` | `https://example.com/podcast/rss` |
| Personal OneDrive site | `https://***-my.sharepoint.com/personal/***` | `https://contoso-my.sharepoint.com/personal/alex_contoso_com` |
| List ID | `****...****` | `00000000-0000-4000-8000-000000000003` |
| SharePoint connection account | `***@***` | `alex@contoso.com` |
| 3 connection IDs | `****...****` | `connection-1` to `connection-3` |
| Flow and package IDs | `****...****` | fictional GUIDs |

I'll keep the show name "Harbor Cast".

**6. A few things the export can't tell me.**
- Why the conversion sits before Create item. My draft: "The summary arrives as HTML, and the list should show plain text."
- Quick checks: I suggest all three guardrails.
- Test result to show? If not, the finish screen lists what the walkthrough covered.

Approve the table and answer what you can; I'll use my drafts for anything you skip.

**User:** Approved, drafts are fine, no test numbers.

**Copilot:** Building one page with 3 steps, 3 guardrails and 3 quick checks, using the approved fictional values.

---

What the chat wrote to the handoff file: the goal, the audience, the list name, a what / why / how for each step, the three guardrails tied to their steps, the three quick checks, and a "What you covered" checklist. See `content-schema.md`.

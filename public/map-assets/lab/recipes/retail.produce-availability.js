// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "retail.produce-availability",
  "world": "retail",
  "featured": true,
  "order": 3,
  "locationId": "retail.produce.display",
  "label": "Produce display",
  "view": null,
  "anchor": [
    0,
    1,
    0
  ],
  "title": "Keep produce available",
  "benefit": "Colleagues restock the crate that is running low, not every crate.",
  "limits": "A camera sees how full a crate looks, not stock in the back room; a hand or a trolley can hide it.",
  "whereItRuns": [
    "Shelf camera",
    "Store GPU",
    "Colleague"
  ],
  "provenance": [
    {
      "label": "Verified category: Coles release on stock-level vision, 30 October 2025",
      "url": "https://www.colesgroup.com.au/FormBuilder/_Resource/_module/ZD2n6-Cs4kiufz91cjPU3Q/301025_Media_Release_Coles_accelerates_AI_adoption_in_retail_with_OpenAI.pdf",
      "kind": "verified"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "Produce crates are full at the start of the day",
      "say": "The produce display at opening, every crate full."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "The middle crate runs low through the morning",
      "say": "Shoppers take from the middle crate until it runs low."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The store camera sees the middle crate is low",
      "say": "A fullness rule on the in-store server flags the low crate.",
      "sensor": "site-cam",
      "overlay": {
        "anchor": "subject",
        "label": "For review",
        "state": "review"
      }
    },
    {
      "id": "review",
      "at": 16,
      "caption": "A colleague checks stock and refills it",
      "say": "A colleague checks stock and refills it. The camera saw the crate, not the back room."
    }
  ],
  "variation": {
    "id": "hand",
    "label": "Hand over crate",
    "caption": "View blocked · another look needed",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

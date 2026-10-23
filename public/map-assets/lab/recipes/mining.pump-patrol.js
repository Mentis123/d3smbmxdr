// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "mining.pump-patrol",
  "world": "mining",
  "featured": true,
  "order": 2,
  "locationId": "mining.processing.plant",
  "label": "Pump patrol",
  "view": "plant",
  "anchor": [
    6.9,
    3.0,
    -0.2
  ],
  "title": "A robot finds a new wet area by a pump",
  "benefit": "Fitters hear about a new wet patch by a pump between rounds, before it becomes a failure.",
  "limits": "The robot compares today with a stored baseline; a wash-down or spill also looks wet, so a fitter checks the pump.",
  "whereItRuns": [
    "Robot camera",
    "Site GPU",
    "Fitter"
  ],
  "provenance": [
    {
      "label": "Vendor case: legged robot inspection rounds at Vale (ANYbotics)",
      "url": "https://www.anybotics.com/news/anymal-helps-vale-to-prioritize-people-in-mining/",
      "kind": "vendor"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "Pumps in the plant run through the night shift",
      "say": "The plant pump bay runs around the clock. A robot walks the same round every few hours."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "The robot stops at pump P-12 on its round",
      "say": "At pump P-12 the robot stops and looks from the same spot as last time."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The robot camera sees a new wet area",
      "say": "The site GPU compares this view with the stored baseline and marks a wet area that was not there before.",
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
      "caption": "A fitter inspects pump P-12",
      "say": "A fitter inspects P-12 and decides what to do. The robot found the change; the fitter finds the cause."
    }
  ],
  "variation": {
    "id": "reflection",
    "label": "Reflection",
    "caption": "View unclear · another look needed",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

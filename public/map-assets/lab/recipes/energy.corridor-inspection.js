// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "energy.corridor-inspection",
  "world": "energy",
  "featured": true,
  "order": 3,
  "locationId": "energy.grid.network",
  "label": "Line patrol",
  "view": "grid",
  "anchor": [
    6.65,
    4.3,
    -2.75
  ],
  "title": "A drone finds a stretch of line to inspect",
  "benefit": "The vegetation crew goes first to the span that needs them.",
  "limits": "A camera view cannot measure clearance; it points a crew to a span, and the crew measures on the ground.",
  "whereItRuns": [
    "Drone camera",
    "Site GPU",
    "Vegetation crew"
  ],
  "provenance": [
    {
      "label": "Verified programme: Ausgrid drone survey of its network",
      "url": "https://www.ausgrid.com.au/About-Us/News/Drone-survey",
      "kind": "verified"
    },
    {
      "label": "Verified research: onboard line detection on a drone (Landsnet, HICSS-55)",
      "url": "https://aisel.aisnet.org/hicss-55/st/smart_app_development/3",
      "kind": "verified"
    },
    {
      "label": "Operator programme: National Grid autonomous drone inspections",
      "url": "https://www.nationalgrid.com/powering-future-national-grid-rolls-out-centralised-autonomous-drone-inspections-across-its-network",
      "kind": "verified"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "Power lines run from the yard toward the town",
      "say": "Lines carry power from the substation to the town across bush and paddocks."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "The drone follows the line and pauses at span 4",
      "say": "A drone flies the corridor; its onboard model keeps the camera on the conductors."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The drone camera sees branches close to the line",
      "say": "Imagery goes to the site GPU, which marks vegetation near the line at span 4.",
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
      "caption": "A vegetation crew checks span 4 first",
      "say": "The crew checks span 4 first and measures clearance on the ground. The drone pointed; people decide."
    }
  ],
  "variation": {
    "id": "low-sun",
    "label": "Low sun",
    "caption": "View unclear · another look needed",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

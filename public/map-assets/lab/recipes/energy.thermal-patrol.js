// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "energy.thermal-patrol",
  "world": "energy",
  "featured": true,
  "order": 2,
  "locationId": "energy.grid.substation",
  "label": "Thermal patrol",
  "view": "grid-detail",
  "anchor": [
    7.3,
    2.75,
    -0.65
  ],
  "title": "A robot spots an unusual hot connection",
  "benefit": "Inspectors find a connector running warmer than its neighbours between rounds, without walking the live yard.",
  "limits": "Thermal shows heat, not cause; load and reflections change readings, so an inspector reviews the image before any outage is planned.",
  "whereItRuns": [
    "Robot camera",
    "Site GPU",
    "Inspector"
  ],
  "provenance": [
    {
      "label": "Verified pattern: Tomago Aluminium trialled a robot with thermal imaging in its substation",
      "url": "https://www.tomago.com.au/tomago-aluminium-puts-spot-on-the-spot/",
      "kind": "verified"
    },
    {
      "label": "Vendor case: robot thermal rounds at National Grid (Boston Dynamics)",
      "url": "https://bostondynamics.com/case-studies/spot-becomes-part-of-the-team-at-national-grid/",
      "kind": "vendor"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "The substation yard runs normally on a quiet day",
      "say": "A substation steps power down for the town. A robot walks a fixed inspection round."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "The robot stops at its next inspection point",
      "say": "At each stop the robot points its cameras at the same equipment, the same way, every round."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The thermal camera sees one connector warmer than others",
      "say": "On the site GPU the thermal image is matched to the asset. One connector reads warmer than its neighbours, so it is flagged for review.",
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
      "caption": "An inspector reviews the image and plans the work",
      "say": "An inspector looks at the thermal image and decides whether to plan an outage. Nobody had to enter the live yard to find it."
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

// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "mining.yard-awareness",
  "world": "mining",
  "featured": true,
  "order": 3,
  "locationId": "mining.workshop",
  "label": "Yard corner",
  "view": "workshop",
  "anchor": [
    5.6,
    3.1,
    4.0
  ],
  "title": "See around the loading-bay corner",
  "benefit": "The loader operator knows someone is in the review zone before turning the corner.",
  "limits": "This is an advisory, not a safety system; a hidden person may not be seen, so site rules and spotters still apply.",
  "whereItRuns": [
    "Yard camera",
    "Site GPU",
    "Supervisor"
  ],
  "provenance": [
    {
      "label": "Pattern: region, line and persistence rules on video analytics (NVIDIA DeepStream nvdsanalytics)",
      "url": "https://docs.nvidia.com/metropolis/deepstream/8.0/text/DS_plugin_gst-nvdsanalytics.html",
      "kind": "pattern"
    },
    {
      "label": "Vendor offering: mining zone and proximity analytics (viAct)",
      "url": "https://www.viact.ai/industry/mining-ai-safety-solution",
      "kind": "vendor"
    },
    {
      "label": "Vendor offering: mining site cameras (Axis)",
      "url": "https://www.axis.com/solutions/industrial/mining",
      "kind": "vendor"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "A loader works the yard beside the workshop",
      "say": "The workshop yard is busy: a loader moves stock past a blind corner."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "A worker walks toward the loading-bay corner",
      "say": "A worker walks toward the corner the loader operator cannot see around."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The yard camera sees a person and loader in the zone",
      "say": "The overhead camera sees both inside the painted review zone. It has to fire in under a second, so it runs on site.",
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
      "caption": "The supervisor alerts the operator, who holds",
      "say": "The supervisor advises the operator, who holds until the worker is clear. People act; the camera only advises."
    }
  ],
  "variation": {
    "id": "occlusion",
    "label": "Partly hidden",
    "caption": "View limited · another look needed",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

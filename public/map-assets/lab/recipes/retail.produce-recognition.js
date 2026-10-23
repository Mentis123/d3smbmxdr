// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "retail.produce-recognition",
  "world": "retail",
  "featured": true,
  "order": 1,
  "locationId": "retail.produce.scales",
  "label": "Produce scale",
  "view": null,
  "anchor": [
    0,
    1,
    0
  ],
  "title": "Recognise your produce",
  "benefit": "Less searching through produce menus at the self-checkout.",
  "limits": "The camera suggests; the customer confirms, and the scale supplies the weight.",
  "whereItRuns": [
    "Scale camera",
    "Store GPU",
    "Customer"
  ],
  "provenance": [
    {
      "label": "Verified: Coles produce recognition on in-store GPUs (Microsoft case study)",
      "url": "https://news.microsoft.com/source/asia/features/coles-deepens-its-relationship-with-shoppers-using-ai-to-understand-the-customer-experience-and-improve-efficiency-in-store/",
      "kind": "verified"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "A customer brings fruit to the self-checkout",
      "say": "A self-checkout with a produce scale and a small camera above it."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "Bananas go on the scale",
      "say": "The customer puts loose bananas on the scale."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The scale camera recognises bananas",
      "say": "The in-store server recognises bananas and offers them first.",
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
      "caption": "The customer confirms; the scale gives the weight",
      "say": "The customer confirms. The weight is the scale's, not the camera's."
    }
  ],
  "variation": {
    "id": "bagged",
    "label": "Bagged bunch",
    "caption": "Not sure · customer picks from a short list",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

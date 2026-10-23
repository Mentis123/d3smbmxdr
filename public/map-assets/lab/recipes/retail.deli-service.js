// STUB recipe: real title, benefit, limits and provenance from AI-LAB-MASTER-PLAN.md; chapters are placeholders
// until the exhibit is built. Pure data, no imports.
export default {
  "id": "retail.deli-service",
  "world": "retail",
  "featured": true,
  "order": 2,
  "locationId": "retail.deli.counter",
  "label": "Deli counter",
  "view": null,
  "anchor": [
    0,
    1,
    0
  ],
  "title": "Help a waiting customer",
  "benefit": "A colleague knows a customer is waiting at the deli.",
  "limits": "It notices someone standing in the service area, not who they are; a passer-by can look like a waiting customer.",
  "whereItRuns": [
    "Deli camera",
    "Store GPU",
    "Colleague"
  ],
  "provenance": [
    {
      "label": "Verified: Coles deli notifications from in-store cameras (Microsoft case study)",
      "url": "https://news.microsoft.com/source/asia/features/coles-deepens-its-relationship-with-shoppers-using-ai-to-understand-the-customer-experience-and-improve-efficiency-in-store/",
      "kind": "verified"
    }
  ],
  "duration": 26,
  "chapters": [
    {
      "id": "scene",
      "at": 0,
      "caption": "The deli counter is quiet mid-morning",
      "say": "The deli counter, quiet between rushes."
    },
    {
      "id": "change",
      "at": 4,
      "caption": "A customer stops at the counter and waits",
      "say": "A customer arrives and waits in the service area."
    },
    {
      "id": "aiView",
      "at": 10,
      "caption": "The store camera sees someone waiting",
      "say": "The in-store server sees a person waiting for a while and sends a notification.",
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
      "caption": "A colleague comes to serve them",
      "say": "A colleague comes over to serve. Nobody is identified; it only notices waiting."
    }
  ],
  "variation": {
    "id": "passer-by",
    "label": "Passer-by",
    "caption": "Just passing · no alert",
    "overlay": {
      "anchor": "subject",
      "label": "View unclear",
      "state": "unclear"
    }
  },
  "stub": true
};

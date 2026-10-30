# Decision Room pattern

The format behind every Decision Room, written as the seed for a skill that builds new ones. Agent 0
(`ironvale@0.2`) is the reference build.

## The promise to the player

No wrong answers. Only trade-offs. Every screen before the activity is friction: say that in as few words
as possible and get people to their first call.

## Three ways to play, one content file

| | Solo | Group, in the room | Group, online |
|---|---|---|---|
| Start | Edition page → Solo | Edition page → With a group → In the room | → Online |
| Who runs it | Nobody | Facilitator, display up front | Facilitator, remote |
| Devices | One | One per table | Everyone; one per team holds the pen |
| After each call | Reflection page | The room's split, then discussion | Same, on every screen |
| Guidance (the expert's leaning) | Shown after each call | Facilitator only | Facilitator only |

All three read the same scenario revision. Nothing is authored twice.

## What a workshop is made of

A scenario (`lib/decision-room/types.ts`) with:

- **Story**: organisation, what it holds, the adversary or pressure, the seats people sit in, the time axis.
- **State**: named facts with toned values (Ironvale) or numeric meters (Riverbend), plus the stage path.
- **Six rounds** (four to eight works). Each has:
  - seat, time and title
  - situation (at most 55 words), question (at most 12)
  - an optional briefing with sourced evidence and what is still uncertain
  - four options of at most 8 words, each with a **cost**: "what you gain; what you give up" in at most 16 words, written so the preferred option bites too
  - a consequence per option (what you did, what happened, changes, state transitions), with variants keyed on earlier calls or state
  - a **reveal**: what the tools did and did not do, the lesson, two discussion questions
  - **guidance**: preferred option, the conditions it holds under, the case for another call, the evidence that would change it

`npm run check:decision-room-scenarios` enforces the word limits and the four-different-costs rule.

## Solo: the reflection page

After each call, in this order:

1. **What your call changed**: the consequence, and only the states it moved.
2. **Every option costs something**: all four options with their costs, yours marked.
3. **One expert view**: the leaning, when it holds, the case for another call, what would change it. Labelled "a view, not a verdict".
4. **What the tools did, and did not do**: the boundary, the lesson, two questions to sit with.

The end page lists every call beside the expert leaning, with **Replay from here** on each. Where they part
ways is the place to look, not a score.

## Branching: keep it shallow

Conditional consequences and briefing variants, not forked storylines. A forked plot multiplies the
writing and needs a facilitator to keep tables in step. Conditions on earlier calls and on state give every
player a story that is clearly theirs, with one set of rounds.

## The builder (next): document in, workshop out

For a person with a deck, a document or notes who wants a Decision Room of their own.

1. **Ingest.** Drop a PPTX, DOCX, PDF or paste text. The model reads it and proposes one **story card**:
   organisation, what is at stake, the pressure, the seats, the time axis, the state to track. Chat to
   reshape it, or edit the card. **Lock the story.**
2. **Rounds.** It drafts six round cards from the source, each complete: situation, four options with costs,
   consequences, reveal and guidance. Edit any text in place, or open a chat scoped to that card ("make B
   more tempting", "this consequence is too gentle"). Each card has **Regenerate** and **Accept**.
3. **Balance check.** Flags before anyone runs it: an option nobody would defend, the same preferred letter
   every round, costs that only ever go one way, a round with no voice from legal, the board or the
   customer, no variants anywhere, any word limit broken.
4. **Accept all and build.** One button at any point. It writes the scenario, runs the check and drops the
   author into **solo mode of their own workshop**. Playing it is the review.
5. **Publish.** Edition page, solo link, run sheet, printable lock cards. It stays editable: the builder
   reopens on the same workshop, and a published change becomes a new revision so earlier rooms keep their
   meaning.

What this needs that the site does not have yet:

- **Workshops as data.** Scenarios are TypeScript files today. A built workshop has to live in the database
  as JSON with the same shape, resolved by key like the bundled ones.
- **A model API key** on the server for ingestion and drafting, and a cost ceiling per workshop.
- **Author access.** Who may create, edit and publish a workshop, separate from the facilitator key.
- **Guards on published content.** Room text ships to every device, so the builder must warn about prices,
  real customer names and anything internal in the source document.

Every step before "Accept all" is skippable. Someone with a good deck should have a playable draft in ten
minutes without opening a chat.

## Prior art

- Persistent state read by the debrief is the common solo pattern
  ([Twine incident-response prompt](https://gist.github.com/joswr1ght/770e71a9cd8c4447fdde92c99044b468)).
- Branching that looks good on paper needs more facilitation than is practical
  ([technology-enhanced tabletop exercises](https://arxiv.org/pdf/2607.28179)).
- Solo play suits individual learning, team play suits debate
  ([HBP simulation types](https://help.hbsp.harvard.edu/hc/en-us/articles/360052867633-Comparing-Simulation-Types-Synchronous-vs-Asynchronous)).
- Upload, structure, edit, approve, generate, then test as a learner
  ([CBT Nuggets](https://www.cbtnuggets.com/support/internal-training/internal-training-creating-ai-assisted-content),
  [ThingLink scenario builder](https://support.thinglink.com/hc/en-us/articles/27049171376919),
  [Easy Llama](https://help.easyllama.com/how-to-use-the-course-authoring-tool-to-create-an-interactive-ai-scenario)).

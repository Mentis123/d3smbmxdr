/**
 * Decision Room "on rails" families: the whole workshop runs from the display with Next/Back
 * (15 screens: welcome, instructions, six decision/discussion pairs, close). Coastwater was first.
 * Each family maps to its edition URL (/decision-room/<edition>) and the room variant it creates.
 */
export const RAILS = {
  coastwater: { edition: "coastwater", variant: "coastwater", branching: false },
  marlowvale: { edition: "marlow-vale", variant: "marlowvale", branching: false },
  // Agent 0 since 29 Oct 2026. Branching: each table's phone still shows its own consequence and state,
  // and the round content comes from the server (/deck) because Ironvale's guidance is an answer key.
  ironvale: { edition: "agent-0", variant: "agent0", branching: true },
} as const;
export type RailsFamily = keyof typeof RAILS;

export const isRails = (family: string | null | undefined): family is RailsFamily => Boolean(family && family in RAILS);
export const railsEdition = (family: RailsFamily) => RAILS[family].edition;
export function railsFamilyOfEdition(edition: string | null | undefined): RailsFamily | null {
  return (Object.keys(RAILS) as RailsFamily[]).find((family) => RAILS[family].edition === edition) ?? null;
}
export function railsFamilyOfVariant(variant: string | null | undefined): RailsFamily | null {
  return (Object.keys(RAILS) as RailsFamily[]).find((family) => RAILS[family].variant === variant) ?? null;
}
/** Families whose phones keep per-table consequences and the state panel after each round. */
export const isBranchingRails = (family: string | null | undefined) => isRails(family) && RAILS[family].branching;
/** Families that show the Microsoft partner mark (security content built on Microsoft products). */
export const showsMicrosoft = (family: string | null | undefined) => !isRails(family) || family === "ironvale";
/** coastwater@1 keeps its original five-screen-per-decision presenter; every other rails room uses two. */
export const isLegacyRails = (key: string) => key === "coastwater@1";

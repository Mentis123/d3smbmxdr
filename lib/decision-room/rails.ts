/**
 * Decision Room "on rails" families: the whole workshop runs from the display with Next/Back
 * (15 screens: welcome, instructions, six decision/discussion pairs, close). Coastwater was first.
 * Each family maps to its edition URL (/decision-room/<edition>) and the room variant it creates.
 */
export const RAILS = {
  coastwater: { edition: "coastwater", variant: "coastwater" },
  marlowvale: { edition: "marlow-vale", variant: "marlowvale" },
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
/** coastwater@1 keeps its original five-screen-per-decision presenter; every other rails room uses two. */
export const isLegacyRails = (key: string) => key === "coastwater@1";

export const COASTWATER_LAST_STEP = 32; // Maximum accepted for existing revision-1 rooms.
type Room = { status: string; activeRound: number; resultsVisible: boolean; roundClosedAt: string | null; presentationStep?: number | null };
export const coastwaterLastStep = (key: string) => key === "coastwater@1" ? 32 : 14;
export function coastwaterStep(session: Room, key = "coastwater@1") {
  const legacy = key === "coastwater@1";
  if (session.presentationStep != null) return Math.min(coastwaterLastStep(key), session.presentationStep);
  if (session.status === "ended") return coastwaterLastStep(key);
  if (session.status === "lobby") return 0;
  if (session.status === "launched") return 1;
  return legacy ? 2 + (session.activeRound - 1) * 5 + (session.resultsVisible ? 3 : session.roundClosedAt ? 2 : 1) : 2 + (session.activeRound - 1) * 2 + (session.resultsVisible || session.roundClosedAt ? 1 : 0);
}
/** Reviewing a previous screen never rewinds votes or rounds. */
export function coastwaterOperation(session: Room, step: number, key = "coastwater@1") {
  if (session.status === "ended") return "noop";
  if (step === coastwaterLastStep(key)) return "end";
  if (step < 2) return "noop";
  const legacy = key === "coastwater@1", length = legacy ? 5 : 2;
  const round = Math.floor((step - 2) / length) + 1, phase = (step - 2) % length;
  if (phase === (legacy ? 1 : 0)) {
    if (session.status === "lobby" || session.status === "launched") return "start";
    if (round === session.activeRound + 1) return "advance";
  }
  if (round === session.activeRound && !session.resultsVisible) {
    if (legacy && phase === 2 && !session.roundClosedAt) return "close";
    if (phase === (legacy ? 3 : 1)) return "publish";
  }
  return "noop";
}

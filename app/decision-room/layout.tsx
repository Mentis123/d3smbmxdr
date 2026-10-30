import type { ReactNode } from "react";

export const metadata = {
  title: "Decision Room | Data#3",
  description: "Live room instrument for the tabletop exercise: one phone per table, six rounds, vote A–D, lock, see where the room landed.",
};

/** The browser bar and any overscroll match the room's navy instead of the site's light default. */
export const viewport = { themeColor: "#000025", colorScheme: "dark" };

export default function DecisionRoomLayout({ children }: { children: ReactNode }) {
  return children;
}

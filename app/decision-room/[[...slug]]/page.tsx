"use client";

import dynamic from "next/dynamic";

// Client-only: the views read localStorage and the query string on first render.
const DecisionRoom = dynamic(() => import("../DecisionRoom"), { ssr: false });

export default function DecisionRoomPage() {
  return <DecisionRoom />;
}

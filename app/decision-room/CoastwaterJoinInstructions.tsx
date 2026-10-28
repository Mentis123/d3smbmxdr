import { QRCodeSVG } from "qrcode.react";

export default function CoastwaterJoinInstructions({ code, name = "Coastwater" }: { code?: string; name?: string }) {
  return <aside className="cw-join" aria-label={`How to join ${name}`}>
    <p className="cw-kicker">JOIN THE WORKSHOP</p>
    <ol><li>Open <a href="https://bit.ly/4Bg3QuC" target="_blank" rel="noreferrer">bit.ly/4Bg3QuC</a></li><li>Enter room code <strong className="cw-room-code">{code || "XXXXXX"}</strong></li><li>Choose your table and join.</li></ol>
    <p>One device per table.</p>
    {code ? <div className="cw-join-qr"><QRCodeSVG value={`${location.origin}/decision-room/join/${code}`} size={90} /><small>Or scan to join<br />this room directly.</small></div> : <small>The facilitator's live room code appears here once a room is created.</small>}
  </aside>;
}

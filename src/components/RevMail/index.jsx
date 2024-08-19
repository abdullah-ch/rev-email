import { useRevMail } from "../../hooks";

export const RevMail = () => {
  const { canvasRef, riveReady } = useRevMail()
  return (
    <div className="RiveContainer">
      {!riveReady && <p>Loading...</p>}
      <canvas
        ref={canvasRef}
        style={{ display: riveReady ? "block" : "none" }}
      />
    </div>
  );
};
import { useEffect, useRef, useState } from "react";
import RiveCanvas from "@rive-app/canvas-advanced";
import { registerRiveListeners } from "../components/RevMail/revMail.util";

export const useRevMail = () => {
  const canvasRef = useRef(null);
  const riveRef = useRef(null);
  const [riveReady, setRiveReady] = useState(false);
  const [inputText, setInputText] = useState("EMAILADDRESS@DOMAIN.COM");
  const [onFocus, setOnFocus] = useState(false);

  useEffect(() => {
    async function loadRiveAnimation() {
      const rive = await RiveCanvas({
        locateFile: () =>
          `https://unpkg.com/@rive-app/canvas-advanced@2.19.7/rive.wasm`,
      });

      const canvas = canvasRef.current;
      canvas.height = 400;
      canvas.width = 500;

      const renderer = rive.makeRenderer(canvas);
      const bytes = await (
        await fetch(new Request("/mailing_list_signup.riv"))
      ).arrayBuffer();
      const file = await rive.load(new Uint8Array(bytes));
      const artboard = file.artboardByIndex(0);

      let stateMachine = artboard.stateMachineByName("MainSM");
      if (!stateMachine) {
        console.error("State Machine 'MainSM' not found on the artboard");
        return;
      }

      const stateMachineInstance = new rive.StateMachineInstance(
        stateMachine,
        artboard
      );
      const setupListeners = registerRiveListeners(
        canvas,
        renderer,
        rive,
        rive.Fit.contain,
        rive.Alignment.center
      );

      setupListeners(artboard, stateMachineInstance);

      const textInput = artboard.textRun("txtMailInput");
      if (!textInput) {
        console.error("Text input 'txtMailInput' not found on the artboard");
        return;
      }

      riveRef.current = {
        rive,
        renderer,
        artboard,
        textInput,
        stateMachineInstance,
      };
      setRiveReady(true);

      startRenderLoop();
    }

    loadRiveAnimation();
  }, [onFocus]);

  const startRenderLoop = () => {
    const { rive, renderer, artboard, textInput, stateMachineInstance } =
      riveRef.current;

    let lastBlinkTime = 0;
    const blinkInterval = 500; // Time in ms between cursor toggles
    let cursorVisible = true;

    function renderLoop(time) {
      if (time - lastBlinkTime > blinkInterval && onFocus) {
        cursorVisible = !cursorVisible;
        lastBlinkTime = time;
      }

      const textWithCursor = cursorVisible ? `${inputText}|` : inputText;
      textInput.text = textWithCursor;

      const numFiredEvents = stateMachineInstance.reportedEventCount();
      if (numFiredEvents > 0) {
        for (let i = 0; i < numFiredEvents; i++) {
          const event = stateMachineInstance.reportedEventAt(i);
          if (event.name === "txtFiedMouseDown" && !onFocus) {
            setOnFocus(true);
          }
          if (event.name === "btnSubmitClick") {
            onSubmit();
          }
        }
      }

      stateMachineInstance.advance(time / 1000);

      renderer.clear();
      artboard.advance(time / 1000);
      renderer.save();
      renderer.align(
        rive.Fit.contain,
        rive.Alignment.center,
        {
          minX: 0,
          minY: 0,
          maxX: canvasRef.current.width,
          maxY: canvasRef.current.height,
        },
        artboard.bounds
      );
      artboard.draw(renderer);
      renderer.restore();
      rive.requestAnimationFrame(renderLoop);
    }

    rive.requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    if (riveRef.current) {
      startRenderLoop();
    }
    function handleKeyDown(event) {
      let newText = inputText;
      if (event.key.length === 1) {
        newText += event.key;
      } else if (event.key === "Backspace") {
        newText = newText.slice(0, -1);
      }
      setInputText(newText);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputText]);

  const onSubmit = () => {
    console.log("Submit");
  };

  return {
    canvasRef,
    riveReady,
    inputText,
    onFocus,
    setOnFocus,
    setInputText,
  };
};

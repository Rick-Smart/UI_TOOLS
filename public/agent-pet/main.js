import { createPetEngine } from "./petEngine.js";
import { buildPetState, queryAgentId } from "./petState.js";

function init() {
  const agentId = queryAgentId();
  const canvas = document.getElementById("pet-canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  let currentState = buildPetState(agentId);
  let currentContext = {
    pathname: "",
    checklistCompleted: 0,
    checklistTotal: 0,
    topSafeInset: 8,
  };

  const engine = createPetEngine(
    canvas,
    () => currentState,
    () => currentContext,
  );

  engine.start();

  function syncDom() {
    currentState = buildPetState(agentId);
  }

  function handleStorage(event) {
    const key = String(event.key || "");
    if (!key.includes(`azdes.pet.v1.agent.${agentId}.`)) {
      return;
    }

    syncDom();
  }

  function handleMessage(event) {
    if (event?.data?.type === "azdes.pet.refresh") {
      syncDom();
      return;
    }

    if (event?.data?.type === "azdes.pet.context") {
      const nextContext = event.data.context || {};
      currentContext = {
        pathname: String(nextContext.pathname || ""),
        checklistCompleted: Number(nextContext.checklistCompleted || 0),
        checklistTotal: Number(nextContext.checklistTotal || 0),
        topSafeInset: Number(nextContext.topSafeInset || 8),
      };
      return;
    }

    if (event?.data?.type === "azdes.pet.click") {
      engine.handleViewportClick(event.data.x, event.data.y);
    }
  }

  syncDom();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("message", handleMessage);

  window.addEventListener("beforeunload", () => {
    engine.stop();
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("message", handleMessage);
  });
}

init();

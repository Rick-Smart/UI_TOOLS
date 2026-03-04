import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getPetIframeUrl,
  getPetStateForCurrentAgent,
  simulatePetRewardForTesting,
  subscribePetState,
} from "../../utils/petBridge";
import "./AgentPetHost.css";

function AgentPetHost() {
  const [petState, setPetState] = useState(getPetStateForCurrentAgent);
  const [checklistProgress, setChecklistProgress] = useState({
    completed: 0,
    total: 0,
  });
  const topSafeInset = 8;
  const iframeRef = useRef(null);
  const isDevBuild = Boolean(import.meta.env?.DEV);
  const location = useLocation();
  const debugFlag = new URLSearchParams(location.search).get("petDebug");
  const isDebugPetUi = !(
    debugFlag === "0" ||
    debugFlag === "false" ||
    debugFlag === "off"
  );
  const selectedPetId = petState.profile.selectedPetId;
  const iframeSrc = isDebugPetUi
    ? `${getPetIframeUrl()}&debug=1`
    : getPetIframeUrl();

  useEffect(() => {
    return subscribePetState((nextState) => {
      setPetState(nextState);
    });
  }, []);

  useEffect(() => {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    iframeRef.current.contentWindow.postMessage(
      { type: "azdes.pet.refresh" },
      "*",
    );

    iframeRef.current.contentWindow.postMessage(
      {
        type: "azdes.pet.context",
        context: {
          pathname: location.pathname,
          checklistCompleted: checklistProgress.completed,
          checklistTotal: checklistProgress.total,
          topSafeInset,
        },
      },
      "*",
    );
  }, [
    checklistProgress.completed,
    checklistProgress.total,
    location.pathname,
    petState.agentId,
    petState.profile.enabled,
    petState.profile.selectedPetId,
    petState.progress.totalPoints,
    petState.progress.qualifyingFiveStarCount,
    topSafeInset,
  ]);

  useEffect(() => {
    const handleChecklistProgress = (event) => {
      setChecklistProgress({
        completed: Number(event?.detail?.completed || 0),
        total: Number(event?.detail?.total || 0),
      });
    };

    window.addEventListener(
      "azdes.callHandling.checklist-progress",
      handleChecklistProgress,
    );

    return () => {
      window.removeEventListener(
        "azdes.callHandling.checklist-progress",
        handleChecklistProgress,
      );
    };
  }, []);

  useEffect(() => {
    const handleWindowClick = (event) => {
      if (!iframeRef.current?.contentWindow || !iframeRef.current) {
        return;
      }

      if (event.button !== 0) {
        return;
      }

      const bounds = iframeRef.current.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return;
      }

      const localX = event.clientX - bounds.left;
      const localY = event.clientY - bounds.top;

      iframeRef.current.contentWindow.postMessage(
        {
          type: "azdes.pet.click",
          x: localX,
          y: localY,
        },
        "*",
      );
    };

    window.addEventListener("click", handleWindowClick, true);

    return () => {
      window.removeEventListener("click", handleWindowClick, true);
    };
  }, []);

  function handleSimulateInteraction() {
    simulatePetRewardForTesting(5);
  }

  const devQuickSimButton = isDevBuild ? (
    <button
      type="button"
      className="button-secondary agent-pet-dev-fab"
      onClick={handleSimulateInteraction}
    >
      Simulate interaction
    </button>
  ) : null;

  if (!petState.profile.unlocked) {
    if (!isDevBuild) {
      return null;
    }

    return devQuickSimButton;
  }

  if (!petState.profile.enabled || !selectedPetId) {
    return devQuickSimButton;
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        className={`agent-pet-roamer-layer${isDebugPetUi ? " agent-pet-roamer-layer--interactive" : ""}`}
        title="Agent pet roamer"
        src={iframeSrc}
      />
      {devQuickSimButton}
    </>
  );
}

export default AgentPetHost;

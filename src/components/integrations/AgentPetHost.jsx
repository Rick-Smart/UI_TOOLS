import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  awardToolUsageReward,
  getPetIframeUrl,
  getPetStateForCurrentAgent,
  simulatePetRewardForTesting,
  subscribePetState,
} from "../../utils/petBridge";
import "./AgentPetHost.css";

function AgentPetHost() {
  const isPetSystemEnabled = import.meta.env.VITE_PET_SYSTEM_ENABLED === true;
  const [petState, setPetState] = useState(getPetStateForCurrentAgent);
  const [checklistProgress, setChecklistProgress] = useState({
    completed: 0,
    total: 0,
  });
  const topSafeInset = 8;
  const iframeRef = useRef(null);
  const isDevBuild = Boolean(import.meta.env?.DEV);
  const location = useLocation();
  const previousPathnameRef = useRef("");
  const debugFlag = new URLSearchParams(location.search).get("petDebug");
  const isDebugPetUi =
    isDevBuild && (debugFlag === "1" || debugFlag === "true");
  const selectedPetId = petState.profile.selectedPetId;
  const iframeSrc = isDebugPetUi
    ? `${getPetIframeUrl()}&debug=1`
    : getPetIframeUrl();

  function postMessageToPet(payload) {
    const contentWindow = iframeRef.current?.contentWindow;
    if (!contentWindow) {
      return false;
    }

    contentWindow.postMessage(payload, "*");
    return true;
  }

  function pushPetContext() {
    postMessageToPet({ type: "azdes.pet.refresh" });
    postMessageToPet({
      type: "azdes.pet.context",
      context: {
        pathname: location.pathname,
        checklistCompleted: checklistProgress.completed,
        checklistTotal: checklistProgress.total,
        topSafeInset,
      },
    });
  }

  useEffect(() => {
    if (!isPetSystemEnabled) {
      return;
    }

    const pathname = String(location.pathname || "");
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (!pathname || pathname === "/" || pathname === previousPathname) {
      return;
    }

    awardToolUsageReward({
      source: "tool-start",
      toolPath: pathname,
    });

    postMessageToPet(
      {
        type: "azdes.pet.tool-start",
        context: {
          pathname,
          startedAt: Date.now(),
        },
      },
      "*",
    );
  }, [isPetSystemEnabled, location.pathname]);

  useEffect(() => {
    if (!isPetSystemEnabled) {
      return;
    }

    return subscribePetState((nextState) => {
      setPetState(nextState);
    });
  }, [isPetSystemEnabled]);

  useEffect(() => {
    if (!isPetSystemEnabled) {
      return;
    }

    pushPetContext();
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
    isPetSystemEnabled,
  ]);

  useEffect(() => {
    if (!isPetSystemEnabled) {
      return;
    }

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
  }, [isPetSystemEnabled]);

  useEffect(() => {
    if (!isPetSystemEnabled || !petState.profile.enabled || !selectedPetId) {
      return;
    }

    const handleWindowClick = (event) => {
      if (!iframeRef.current) {
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

      postMessageToPet({
        type: "azdes.pet.click",
        x: localX,
        y: localY,
      });
    };

    window.addEventListener("click", handleWindowClick, true);

    return () => {
      window.removeEventListener("click", handleWindowClick, true);
    };
  }, [isPetSystemEnabled, petState.profile.enabled, selectedPetId]);

  function handlePetIframeLoad() {
    pushPetContext();

    const pathname = String(location.pathname || "");
    if (!pathname || pathname === "/") {
      return;
    }

    postMessageToPet({
      type: "azdes.pet.tool-start",
      context: {
        pathname,
        startedAt: Date.now(),
      },
    });
  }

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

  if (!isPetSystemEnabled) {
    return null;
  }

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
        title="Agent companion roamer"
        src={iframeSrc}
        onLoad={handlePetIframeLoad}
      />
      {devQuickSimButton}
    </>
  );
}

export default AgentPetHost;

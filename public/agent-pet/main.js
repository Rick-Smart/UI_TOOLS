import { createPetEngine } from "./petEngine.js";
import { buildPetState, queryAgentId } from "./petState.js";

function shouldShowDebugOverlay() {
  const params = new URLSearchParams(window.location.search);
  const debugFlag = params.get("debug");
  return debugFlag === "1" || debugFlag === "true";
}

function createTuningPanel() {
  const tuningState = {
    forceAnimationKey: "",
    speedMultiplier: 1,
    scaleMultiplier: 1,
    shadowOffsetAdjust: 0,
    shadowAlpha: 0.18,
    highContrastShadow: false,
    freezeMotion: false,
  };

  const panel = document.createElement("div");
  panel.id = "pet-debug-panel";
  panel.style.position = "fixed";
  panel.style.right = "10px";
  panel.style.top = "18px";
  panel.style.zIndex = "9999";
  panel.style.background = "rgba(2, 6, 23, 0.86)";
  panel.style.color = "#dbeafe";
  panel.style.border = "1px solid rgba(148, 163, 184, 0.4)";
  panel.style.borderRadius = "8px";
  panel.style.padding = "8px 10px";
  panel.style.minWidth = "270px";
  panel.style.font =
    "12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  panel.style.pointerEvents = "auto";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.marginBottom = "6px";
  heading.textContent = "Pet Debug & Tuning";

  const debugBlock = document.createElement("pre");
  debugBlock.style.margin = "0 0 8px 0";
  debugBlock.style.whiteSpace = "pre-wrap";
  debugBlock.style.padding = "6px";
  debugBlock.style.borderRadius = "6px";
  debugBlock.style.background = "rgba(15, 23, 42, 0.55)";
  debugBlock.textContent = "waiting for frame data...";

  const animationLabel = document.createElement("label");
  animationLabel.textContent = "Animation";
  animationLabel.style.display = "block";
  animationLabel.style.marginBottom = "6px";

  const animationSelect = document.createElement("select");
  animationSelect.style.width = "100%";
  animationSelect.style.marginTop = "4px";
  animationSelect.innerHTML = '<option value="">auto</option>';
  animationSelect.addEventListener("change", () => {
    tuningState.forceAnimationKey = animationSelect.value;
  });
  animationLabel.appendChild(animationSelect);

  function createRangeControl(
    labelText,
    min,
    max,
    step,
    initialValue,
    onInput,
  ) {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.marginTop = "8px";

    const valueText = document.createElement("span");
    valueText.style.float = "right";
    valueText.textContent = String(initialValue);

    const title = document.createElement("span");
    title.textContent = labelText;

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initialValue);
    input.style.width = "100%";
    input.style.marginTop = "4px";
    input.addEventListener("input", () => {
      const value = Number(input.value);
      valueText.textContent = String(value);
      onInput(value);
    });

    label.appendChild(title);
    label.appendChild(valueText);
    label.appendChild(input);

    return {
      element: label,
      input,
      valueText,
      setValue: (nextValue) => {
        input.value = String(nextValue);
        valueText.textContent = String(nextValue);
        onInput(Number(nextValue));
      },
    };
  }

  const speedControl = createRangeControl(
    "Speed Mult",
    0.4,
    2.2,
    0.05,
    1,
    (value) => {
      tuningState.speedMultiplier = value;
    },
  );

  const scaleControl = createRangeControl(
    "Scale Mult",
    0.6,
    2,
    0.05,
    1,
    (value) => {
      tuningState.scaleMultiplier = value;
    },
  );

  const shadowControl = createRangeControl(
    "Shadow Offset",
    -18,
    24,
    1,
    0,
    (value) => {
      tuningState.shadowOffsetAdjust = value;
    },
  );

  const shadowAlphaControl = createRangeControl(
    "Shadow Alpha",
    0.05,
    1,
    0.05,
    0.18,
    (value) => {
      tuningState.shadowAlpha = value;
    },
  );

  const freezeLabel = document.createElement("label");
  freezeLabel.style.display = "block";
  freezeLabel.style.marginTop = "8px";
  const freezeInput = document.createElement("input");
  freezeInput.type = "checkbox";
  freezeInput.style.marginRight = "6px";
  freezeInput.addEventListener("change", () => {
    tuningState.freezeMotion = freezeInput.checked;
  });
  freezeLabel.appendChild(freezeInput);
  freezeLabel.appendChild(document.createTextNode("Freeze motion"));

  const contrastShadowLabel = document.createElement("label");
  contrastShadowLabel.style.display = "block";
  contrastShadowLabel.style.marginTop = "6px";
  const contrastShadowInput = document.createElement("input");
  contrastShadowInput.type = "checkbox";
  contrastShadowInput.style.marginRight = "6px";
  contrastShadowInput.addEventListener("change", () => {
    tuningState.highContrastShadow = contrastShadowInput.checked;
  });
  contrastShadowLabel.appendChild(contrastShadowInput);
  contrastShadowLabel.appendChild(
    document.createTextNode("High contrast shadow"),
  );

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.style.marginTop = "10px";
  resetButton.style.width = "100%";
  resetButton.style.border = "1px solid rgba(148,163,184,0.5)";
  resetButton.style.background = "rgba(30,41,59,0.85)";
  resetButton.style.color = "#e2e8f0";
  resetButton.style.borderRadius = "6px";
  resetButton.style.padding = "6px 8px";
  resetButton.textContent = "Reset tuning";
  resetButton.addEventListener("click", () => {
    tuningState.forceAnimationKey = "";
    tuningState.speedMultiplier = 1;
    tuningState.scaleMultiplier = 1;
    tuningState.shadowOffsetAdjust = 0;
    tuningState.shadowAlpha = 0.18;
    tuningState.highContrastShadow = false;
    tuningState.freezeMotion = false;
    animationSelect.value = "";
    freezeInput.checked = false;
    contrastShadowInput.checked = false;
    speedControl.setValue(1);
    scaleControl.setValue(1);
    shadowControl.setValue(0);
    shadowAlphaControl.setValue(0.18);
  });

  panel.appendChild(heading);
  panel.appendChild(debugBlock);
  panel.appendChild(animationLabel);
  panel.appendChild(speedControl.element);
  panel.appendChild(scaleControl.element);
  panel.appendChild(shadowControl.element);
  panel.appendChild(shadowAlphaControl.element);
  panel.appendChild(freezeLabel);
  panel.appendChild(contrastShadowLabel);
  panel.appendChild(resetButton);

  document.body.appendChild(panel);

  let activePetId = "";
  let activeOptionSignature = "";

  function setAnimationOptions(keys) {
    const normalizedKeys = Array.from(
      new Set(
        (Array.isArray(keys) ? keys : [])
          .map((key) => String(key || "").trim())
          .filter(Boolean),
      ),
    );
    const signature = normalizedKeys.join("|");

    animationSelect.innerHTML = '<option value="">auto</option>';

    for (const key of normalizedKeys) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      animationSelect.appendChild(option);
    }

    const keepForced =
      tuningState.forceAnimationKey &&
      normalizedKeys.includes(tuningState.forceAnimationKey);

    if (!keepForced) {
      tuningState.forceAnimationKey = "";
      animationSelect.value = "";
      activeOptionSignature = signature;
      return;
    }

    animationSelect.value = tuningState.forceAnimationKey;
    activeOptionSignature = signature;
  }

  return {
    getTuning: () => ({ ...tuningState }),
    render: (debugState) => {
      if (!debugState) {
        return;
      }

      debugBlock.textContent = [
        `pet: ${debugState.petId || "n/a"}`,
        `top inset: ${debugState.topSafeInset ?? 0}`,
        `zone: ${debugState.routeZone || "n/a"}`,
        `anim: ${debugState.animationKey || "n/a"}`,
        `reason: ${debugState.reason || "n/a"}`,
        `source: ${debugState.frameSourceKind || "n/a"}`,
        `forced: ${debugState.forcedAnimationKey || "none"}`,
        `sequence: ${debugState.sequence || "none"}`,
        `sequence hidden: ${debugState.sequenceHidden ? "yes" : "no"}`,
        `action: ${debugState.action || "n/a"}`,
        `frame: ${debugState.frameIndex + 1}/${debugState.frameCount || 0}`,
        `speed: ${debugState.speed ?? 0}`,
        `base speed mult: ${debugState.baseSpeedMultiplier ?? 1}`,
        `speed mult: ${debugState.effectiveSpeedMultiplier ?? 0}`,
        `base scale: ${debugState.baseAtlasScale ?? 1}`,
        `scale: ${debugState.effectiveScale ?? 0}`,
        `shadow lift: ${debugState.shadowLift ?? 0}`,
        `moving: ${debugState.moving ? "yes" : "no"}`,
      ].join("\n");

      const safeInset = Number(debugState.topSafeInset || 0);
      panel.style.top = `${Math.max(12, safeInset + 10)}px`;

      const petId = String(debugState.petId || "");
      const keySignature = Array.isArray(debugState.availableAnimationKeys)
        ? debugState.availableAnimationKeys
            .map((key) => String(key || "").trim())
            .filter(Boolean)
            .join("|")
        : "";
      if (petId !== activePetId) {
        activePetId = petId;
        setAnimationOptions(debugState.availableAnimationKeys);
      } else if (
        (animationSelect.options.length <= 1 &&
          Array.isArray(debugState.availableAnimationKeys) &&
          debugState.availableAnimationKeys.length) ||
        keySignature !== activeOptionSignature
      ) {
        setAnimationOptions(debugState.availableAnimationKeys);
      }
    },
  };
}

function createRuntimeDiagnosticsOverlay() {
  const panel = document.createElement("div");
  panel.id = "pet-runtime-diagnostics";
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.bottom = "12px";
  panel.style.maxWidth = "min(560px, calc(100vw - 24px))";
  panel.style.maxHeight = "38vh";
  panel.style.overflow = "auto";
  panel.style.zIndex = "9999";
  panel.style.background = "rgba(127, 29, 29, 0.9)";
  panel.style.color = "#fee2e2";
  panel.style.border = "1px solid rgba(254, 202, 202, 0.5)";
  panel.style.borderRadius = "8px";
  panel.style.padding = "8px 10px";
  panel.style.font =
    "12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  panel.style.pointerEvents = "none";
  panel.style.display = "none";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.marginBottom = "6px";
  heading.textContent = "Pet Runtime Diagnostics";

  const body = document.createElement("pre");
  body.style.whiteSpace = "pre-wrap";
  body.style.margin = "0";

  panel.appendChild(heading);
  panel.appendChild(body);
  document.body.appendChild(panel);

  const entries = [];
  const keyCooldownUntil = new Map();
  let hiddenSince = 0;

  function render() {
    if (!entries.length) {
      panel.style.display = "none";
      body.textContent = "";
      return;
    }

    panel.style.display = "block";
    const recent = entries.slice(-6);
    body.textContent = recent
      .map((entry) => {
        const head = `[${entry.time}] [${entry.level}] ${entry.message}`;
        return entry.detail ? `${head}\n${entry.detail}` : head;
      })
      .join("\n\n");
  }

  function log(level, message, detail = "", options = {}) {
    const now = Date.now();
    const dedupeKey = String(options.key || `${level}:${message}`);
    const cooldownMs = Math.max(0, Number(options.cooldownMs || 0));

    if (cooldownMs) {
      const nextAllowedAt = Number(keyCooldownUntil.get(dedupeKey) || 0);
      if (now < nextAllowedAt) {
        return;
      }
      keyCooldownUntil.set(dedupeKey, now + cooldownMs);
    }

    entries.push({
      level,
      message: String(message || "Unknown runtime issue"),
      detail: String(detail || "").slice(0, 1200),
      time: new Date(now).toLocaleTimeString(),
    });

    if (entries.length > 24) {
      entries.splice(0, entries.length - 24);
    }

    render();
  }

  function trackDebugFrame(debugState) {
    if (!debugState) {
      return;
    }

    if (debugState.sequenceHidden) {
      if (!hiddenSince) {
        hiddenSince = Date.now();
      }

      const hiddenDuration = Date.now() - hiddenSince;
      if (hiddenDuration > 5200) {
        log(
          "WARN",
          "Pet hidden stage exceeded 5.2s",
          `sequence=${debugState.sequence || "n/a"} action=${debugState.action || "n/a"}`,
          {
            key: "hidden-stage-timeout",
            cooldownMs: 7000,
          },
        );
      }
    } else {
      hiddenSince = 0;
    }
  }

  return {
    logError: (message, detail, options) =>
      log("ERROR", message, detail, options),
    logWarning: (message, detail, options) =>
      log("WARN", message, detail, options),
    trackDebugFrame,
  };
}

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

  const showDebugOverlay = shouldShowDebugOverlay();
  const tuningPanel = showDebugOverlay ? createTuningPanel() : null;
  const runtimeDiagnostics = createRuntimeDiagnosticsOverlay();
  let lastDebugAt = 0;

  const engine = createPetEngine(
    canvas,
    () => currentState,
    () => currentContext,
    {
      getTuning: () => (tuningPanel ? tuningPanel.getTuning() : {}),
      onRuntimeError: (payload) => {
        runtimeDiagnostics.logError(
          payload?.message || "Pet runtime error",
          payload?.detail || "Unknown render failure",
          {
            key: `engine-runtime:${payload?.message || "unknown"}`,
            cooldownMs: 1200,
          },
        );
      },
      onDebugFrame: (debugState) => {
        runtimeDiagnostics.trackDebugFrame(debugState);

        if (!tuningPanel) {
          return;
        }

        const now = performance.now();
        if (now - lastDebugAt < 80) {
          return;
        }

        lastDebugAt = now;
        tuningPanel.render(debugState);
      },
    },
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
    try {
      if (event.source !== window.parent) {
        return;
      }

      if (event.origin !== window.location.origin) {
        return;
      }

      if (event?.data?.type === "azdes.pet.refresh") {
        syncDom();
        return;
      }

      if (event?.data?.type === "azdes.pet.context") {
        const nextContext = event.data.context || {};
        currentContext = {
          pathname: String(nextContext.pathname || ""),
          checklistCompleted: Math.max(
            0,
            Number(nextContext.checklistCompleted || 0),
          ),
          checklistTotal: Math.max(0, Number(nextContext.checklistTotal || 0)),
          topSafeInset: Math.max(0, Number(nextContext.topSafeInset || 8)),
        };
        return;
      }

      if (event?.data?.type === "azdes.pet.click") {
        const clickX = Number(event.data.x);
        const clickY = Number(event.data.y);
        if (!Number.isFinite(clickX) || !Number.isFinite(clickY)) {
          return;
        }
        engine.handleViewportClick(clickX, clickY);
      }
    } catch (error) {
      runtimeDiagnostics.logError(
        "Message handling failure",
        error?.stack || String(error),
        { key: "message-handler", cooldownMs: 1000 },
      );
    }
  }

  function handleWindowError(event) {
    const message = event?.message || "Unhandled runtime error";
    const location = [event?.filename, event?.lineno, event?.colno]
      .filter(Boolean)
      .join(":");
    const detail = [location, event?.error?.stack].filter(Boolean).join("\n");

    runtimeDiagnostics.logError(message, detail, {
      key: `window-error:${message}`,
      cooldownMs: 1200,
    });
  }

  function handleUnhandledRejection(event) {
    const reason = event?.reason;
    runtimeDiagnostics.logError(
      "Unhandled promise rejection",
      reason?.stack || String(reason || "Unknown rejection"),
      {
        key: "unhandled-rejection",
        cooldownMs: 1200,
      },
    );
  }

  syncDom();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("message", handleMessage);
  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  window.addEventListener("beforeunload", () => {
    engine.stop();
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("message", handleMessage);
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  });
}

init();

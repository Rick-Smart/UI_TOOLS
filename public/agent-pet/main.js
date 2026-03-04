import { createPetEngine } from "./petEngine.js";
import { buildPetState, queryAgentId } from "./petState.js";

function shouldShowDebugOverlay() {
  return false;
}

function createTuningPanel() {
  const cloneValue = (value) => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  };

  const DEFAULT_FISH_OVERRIDES = {
    schooling: {
      sizeRange: [4, 7],
      followerScaleRange: [0.3, 0.5],
      followerMinVisualWidthPx: 15,
      useBoids: true,
      boidLeaderPullWeight: 0,
      boidEnforceMinSpeed: false,
      boidMaxForce: 0.085,
      boidAlignmentWeight: 0.9,
      boidCohesionWeight: 0.7,
      boidSeparationWeight: 1.4,
      minSpeed: 0.68,
    },
    effects: {
      pathTrace: {
        enabled: true,
      },
    },
  };

  const tuningState = {
    forceAnimationKey: "",
    speedMultiplier: 1,
    scaleMultiplier: 1,
    shadowOffsetAdjust: 0,
    shadowAlpha: 0.18,
    highContrastShadow: false,
    freezeMotion: false,
    fishOverridesEnabled: true,
    fishOverrides: cloneValue(DEFAULT_FISH_OVERRIDES),
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
  panel.style.maxHeight = "calc(100vh - 20px)";
  panel.style.overflow = "auto";

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

  function setPathValue(target, path, value) {
    const keys = path.split(".");
    let cursor = target;
    for (let index = 0; index < keys.length - 1; index += 1) {
      const key = keys[index];
      if (!cursor[key] || typeof cursor[key] !== "object") {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[keys[keys.length - 1]] = value;
  }

  function getPathValue(target, path, fallback) {
    const keys = path.split(".");
    let cursor = target;
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (!cursor || typeof cursor !== "object" || !(key in cursor)) {
        return fallback;
      }
      cursor = cursor[key];
    }

    return cursor;
  }

  function createFishRangeControl(label, path, min, max, step, fallback) {
    const initialValue = Number(
      getPathValue(tuningState.fishOverrides, path, fallback),
    );
    return createRangeControl(label, min, max, step, initialValue, (value) => {
      setPathValue(tuningState.fishOverrides, path, value);
    });
  }

  function createFishCheckControl(label, path, fallback = false) {
    const wrapper = document.createElement("label");
    wrapper.style.display = "block";
    wrapper.style.marginTop = "6px";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.style.marginRight = "6px";
    input.checked = Boolean(
      getPathValue(tuningState.fishOverrides, path, fallback),
    );
    input.addEventListener("change", () => {
      setPathValue(tuningState.fishOverrides, path, input.checked);
    });
    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(label));
    return {
      element: wrapper,
      input,
      setValue: (nextValue) => {
        input.checked = Boolean(nextValue);
        setPathValue(tuningState.fishOverrides, path, input.checked);
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

  const fishDetails = document.createElement("details");
  fishDetails.open = true;
  fishDetails.style.marginTop = "10px";
  fishDetails.style.border = "1px solid rgba(148, 163, 184, 0.35)";
  fishDetails.style.borderRadius = "6px";
  fishDetails.style.padding = "6px 8px";

  const fishSummary = document.createElement("summary");
  fishSummary.textContent = "Fish Pathing Tuner";
  fishSummary.style.cursor = "pointer";
  fishSummary.style.fontWeight = "700";
  fishDetails.appendChild(fishSummary);

  const fishEnableControl = createFishCheckControl(
    "Enable fish overrides",
    "enabled",
    true,
  );
  fishEnableControl.input.checked = tuningState.fishOverridesEnabled;
  fishEnableControl.input.addEventListener("change", () => {
    tuningState.fishOverridesEnabled = fishEnableControl.input.checked;
  });

  const fishMinSpeedControl = createFishRangeControl(
    "Follower Min Speed",
    "schooling.minSpeed",
    0.02,
    2.4,
    0.01,
    0.68,
  );
  const fishScaleMinControl = createFishRangeControl(
    "Follower Scale Min",
    "schooling.followerScaleRange.0",
    0.08,
    0.9,
    0.01,
    0.3,
  );
  const fishScaleMaxControl = createFishRangeControl(
    "Follower Scale Max",
    "schooling.followerScaleRange.1",
    0.1,
    1,
    0.01,
    0.5,
  );
  const fishMinVisualWidthControl = createFishRangeControl(
    "Follower Min Width Px",
    "schooling.followerMinVisualWidthPx",
    4,
    24,
    1,
    15,
  );
  const fishTraceEnabledControl = createFishCheckControl(
    "Trace Enabled",
    "effects.pathTrace.enabled",
    true,
  );

  const fishActionsRow = document.createElement("div");
  fishActionsRow.style.display = "grid";
  fishActionsRow.style.gridTemplateColumns = "1fr 1fr";
  fishActionsRow.style.gap = "6px";
  fishActionsRow.style.marginTop = "8px";

  const copyFishButton = document.createElement("button");
  copyFishButton.type = "button";
  copyFishButton.textContent = "Copy fish JSON";
  copyFishButton.style.border = "1px solid rgba(148,163,184,0.5)";
  copyFishButton.style.background = "rgba(15,23,42,0.9)";
  copyFishButton.style.color = "#e2e8f0";
  copyFishButton.style.borderRadius = "6px";
  copyFishButton.style.padding = "6px 8px";

  const resetFishButton = document.createElement("button");
  resetFishButton.type = "button";
  resetFishButton.textContent = "Reset fish";
  resetFishButton.style.border = "1px solid rgba(148,163,184,0.5)";
  resetFishButton.style.background = "rgba(15,23,42,0.9)";
  resetFishButton.style.color = "#e2e8f0";
  resetFishButton.style.borderRadius = "6px";
  resetFishButton.style.padding = "6px 8px";

  const fishStatus = document.createElement("div");
  fishStatus.style.marginTop = "6px";
  fishStatus.style.color = "#93c5fd";
  fishStatus.style.minHeight = "16px";

  copyFishButton.addEventListener("click", async () => {
    const payload = JSON.stringify(tuningState.fishOverrides, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        fishStatus.textContent = "Copied fish override JSON.";
      } else {
        fishStatus.textContent = "Clipboard unavailable; open console JSON.";
        console.log("Fish override JSON:\n", payload);
      }
    } catch {
      fishStatus.textContent = "Copy failed; see console JSON.";
      console.log("Fish override JSON:\n", payload);
    }
  });

  const applyFishControlValues = () => {
    fishMinSpeedControl.setValue(
      Number(
        getPathValue(tuningState.fishOverrides, "schooling.minSpeed", 0.68),
      ),
    );
    fishScaleMinControl.setValue(
      Number(
        getPathValue(
          tuningState.fishOverrides,
          "schooling.followerScaleRange.0",
          0.3,
        ),
      ),
    );
    fishScaleMaxControl.setValue(
      Number(
        getPathValue(
          tuningState.fishOverrides,
          "schooling.followerScaleRange.1",
          0.5,
        ),
      ),
    );
    fishMinVisualWidthControl.setValue(
      Number(
        getPathValue(
          tuningState.fishOverrides,
          "schooling.followerMinVisualWidthPx",
          15,
        ),
      ),
    );
    fishTraceEnabledControl.setValue(
      Boolean(
        getPathValue(
          tuningState.fishOverrides,
          "effects.pathTrace.enabled",
          true,
        ),
      ),
    );
  };

  resetFishButton.addEventListener("click", () => {
    tuningState.fishOverrides = cloneValue(DEFAULT_FISH_OVERRIDES);
    tuningState.fishOverridesEnabled = true;
    fishEnableControl.input.checked = true;
    applyFishControlValues();
    fishStatus.textContent = "Fish overrides reset.";
  });

  fishActionsRow.appendChild(copyFishButton);
  fishActionsRow.appendChild(resetFishButton);

  fishDetails.appendChild(fishEnableControl.element);
  fishDetails.appendChild(fishMinSpeedControl.element);
  fishDetails.appendChild(fishScaleMinControl.element);
  fishDetails.appendChild(fishScaleMaxControl.element);
  fishDetails.appendChild(fishMinVisualWidthControl.element);
  fishDetails.appendChild(fishTraceEnabledControl.element);
  fishDetails.appendChild(fishActionsRow);
  fishDetails.appendChild(fishStatus);

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
    tuningState.fishOverridesEnabled = true;
    tuningState.fishOverrides = cloneValue(DEFAULT_FISH_OVERRIDES);
    animationSelect.value = "";
    freezeInput.checked = false;
    contrastShadowInput.checked = false;
    fishEnableControl.input.checked = true;
    speedControl.setValue(1);
    scaleControl.setValue(1);
    shadowControl.setValue(0);
    shadowAlphaControl.setValue(0.18);
    applyFishControlValues();
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
  panel.appendChild(fishDetails);
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
    getTuning: () => ({
      ...tuningState,
      fishOverridesEnabled: Boolean(tuningState.fishOverridesEnabled),
      fishOverrides: cloneValue(tuningState.fishOverrides),
    }),
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

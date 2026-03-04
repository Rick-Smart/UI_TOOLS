function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function normalizeEnvironmentKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getEnvironmentConfig(profile) {
  const config = profile?.environmentFSM;
  return config && typeof config === "object" ? config : null;
}

export function getEnvironmentAllowedKeys(config, environment, toActionKey) {
  const envKey = normalizeEnvironmentKey(environment);
  if (!config || !envKey) {
    return null;
  }

  const environments =
    config.environments && typeof config.environments === "object"
      ? config.environments
      : {};
  const envConfig = environments[envKey];
  if (!envConfig || !Array.isArray(envConfig.allowedKeys)) {
    return null;
  }

  const normalized = envConfig.allowedKeys
    .map((key) => toActionKey(key))
    .filter(Boolean);
  return normalized.length ? new Set(normalized) : null;
}

export function resolveEnvironmentTransitionSpec(
  config,
  fromEnvironment,
  toEnvironment,
) {
  if (!config || !Array.isArray(config.transitions)) {
    return null;
  }

  const fromKey = normalizeEnvironmentKey(fromEnvironment);
  const toKey = normalizeEnvironmentKey(toEnvironment);
  if (!fromKey || !toKey || fromKey === toKey) {
    return null;
  }

  return (
    config.transitions.find((transitionItem) => {
      if (!transitionItem || typeof transitionItem !== "object") {
        return false;
      }

      return (
        normalizeEnvironmentKey(transitionItem.from) === fromKey &&
        normalizeEnvironmentKey(transitionItem.to) === toKey
      );
    }) || null
  );
}

export function resolveDesiredEnvironment({
  config,
  currentEnvironment,
  fallbackEnvironment,
  centerY,
  canvasHeight,
  beaverLogCyclePhase,
}) {
  if (!config?.enabled) {
    return "";
  }

  const detector = config.detector || {};
  const detectorType = normalizeEnvironmentKey(detector.type || "y-threshold");
  const environments =
    config.environments && typeof config.environments === "object"
      ? Object.keys(config.environments)
      : [];
  const defaultEnvironment =
    normalizeEnvironmentKey(config.initial) ||
    normalizeEnvironmentKey(fallbackEnvironment) ||
    normalizeEnvironmentKey(currentEnvironment) ||
    normalizeEnvironmentKey(environments[0]) ||
    "";

  if (beaverLogCyclePhase) {
    return "water";
  }

  if (detectorType !== "y-threshold") {
    return defaultEnvironment;
  }

  const thresholdRatio = clamp01(Number(detector.thresholdRatio ?? 0.5));
  const thresholdY = canvasHeight * thresholdRatio;
  const hysteresisPx = Math.max(0, Number(detector.hysteresisPx || 0));
  const aboveEnvironment =
    normalizeEnvironmentKey(detector.above) || defaultEnvironment;
  const belowEnvironment =
    normalizeEnvironmentKey(detector.below) || defaultEnvironment;
  const activeEnvironment =
    normalizeEnvironmentKey(currentEnvironment) ||
    normalizeEnvironmentKey(fallbackEnvironment) ||
    defaultEnvironment;

  if (activeEnvironment === aboveEnvironment) {
    if (centerY <= thresholdY + hysteresisPx) {
      return aboveEnvironment;
    }

    return belowEnvironment;
  }

  if (activeEnvironment === belowEnvironment) {
    if (centerY >= thresholdY - hysteresisPx) {
      return belowEnvironment;
    }

    return aboveEnvironment;
  }

  return centerY <= thresholdY ? aboveEnvironment : belowEnvironment;
}

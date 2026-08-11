const root = document.querySelector("#viewRoot");
const PRESETS = [
  { minutes: 5, label: "Quick reset" },
  { minutes: 25, label: "Pomodoro" },
  { minutes: 30, label: "Study sprint" },
  { minutes: 45, label: "Deep focus" },
  { minutes: 60, label: "Full hour" },
  { minutes: 120, label: "Long block" },
];

const state = {
  mode: "grid",
  preset: PRESETS[1],
  duration: PRESETS[1].minutes * 60,
  remaining: PRESETS[1].minutes * 60,
  running: false,
  timerId: null,
};

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function stopTimer(reset = false) {
  clearTimer();
  state.running = false;
  if (reset) {
    state.remaining = state.duration;
  }
}

function startTimer() {
  if (state.running) return;
  state.running = true;
  state.timerId = window.setInterval(() => {
    if (state.remaining <= 1) {
      state.remaining = 0;
      stopTimer(false);
      render();
      return;
    }
    state.remaining -= 1;
    render();
  }, 1000);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function presetGrid() {
  return `
    <h2 class="screenTitle">Choose a timer preset</h2>
    <div class="presetGrid">
      ${PRESETS.map(
        (preset) => `
          <button class="presetButton" data-preset="${preset.minutes}" type="button">
            <strong>${preset.minutes}</strong>
            <span>minutes</span>
            <small>${preset.label}</small>
          </button>
        `,
      ).join("")}
    </div>
  `;
}

function timerScreen() {
  const progress = ((state.duration - state.remaining) / state.duration) * 360;
  return `
    <div class="timerView">
      <h2 class="screenTitle">${state.preset.minutes} minute timer</h2>
      <div class="timerRing" style="--progress:${progress}deg">
        <div class="timerInner">
          <div class="timeReadout">
            <strong>${formatTime(state.remaining)}</strong>
            <span>${state.running ? "Running" : state.remaining === 0 ? "Finished" : "Paused"}</span>
          </div>
        </div>
      </div>
      <div class="controls">
        <button class="controlButton primary" data-action="toggle" type="button">${state.running ? "Pause" : "Start"}</button>
        <button class="controlButton" data-action="reset" type="button">Reset</button>
        <button class="controlButton warn" data-action="back" type="button">Back to presets</button>
      </div>
    </div>
  `;
}

function render() {
  root.innerHTML = state.mode === "grid" ? presetGrid() : timerScreen();
}

document.querySelector("#viewRoot").addEventListener("click", (event) => {
  const presetButton = event.target.closest("[data-preset]");
  if (presetButton) {
    const minutes = Number(presetButton.dataset.preset);
    state.preset = PRESETS.find((preset) => preset.minutes === minutes) || PRESETS[1];
    state.duration = minutes * 60;
    state.remaining = state.duration;
    state.mode = "timer";
    stopTimer(false);
    render();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  if (action === "toggle") {
    if (state.running) {
      stopTimer(false);
    } else if (state.remaining > 0) {
      startTimer();
    }
    render();
    return;
  }

  if (action === "reset") {
    stopTimer(true);
    render();
    return;
  }

  if (action === "back") {
    stopTimer(true);
    state.mode = "grid";
    render();
  }
});

render();

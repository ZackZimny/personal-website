const audio = document.getElementById("kanm-audio") as HTMLAudioElement;
const playButton = document.getElementById("kanm-play-button");
const playerContainer = document.querySelector(".kanm-player");
const playIcon = playButton?.querySelector(".play-icon");
const playText = playButton?.querySelector(".play-text");

if (audio && playButton && playIcon && playText && playerContainer) {
  playButton.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch((err) => {
        console.error("Playback failed:", err);
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    playIcon.textContent = "⏸";
    playText.textContent = "Pause";
    playButton.classList.add("playing");
    playerContainer.classList.add("playing");
  });

  audio.addEventListener("pause", () => {
    playIcon.textContent = "▶";
    playText.textContent = "Play";
    playButton.classList.remove("playing");
    playerContainer.classList.remove("playing");
  });

  audio.addEventListener("waiting", () => {
    if (!audio.paused) {
      playText.textContent = "Loading...";
    }
  });

  audio.addEventListener("playing", () => {
    playText.textContent = "Pause";
  });

  audio.addEventListener("ended", () => {
    playIcon.textContent = "▶";
    playText.textContent = "Play";
    playButton.classList.remove("playing");
    playerContainer.classList.remove("playing");
  });
}

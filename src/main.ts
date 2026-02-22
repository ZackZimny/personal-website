interface SpotifyTrack {
  name: string;
  artists: { name: string; url: string }[];
  image: string;
  url: string;
  played_at: string;
}

async function fetchRecentSong() {
  const container = document.getElementById("spotify-activity");
  if (!container) return;

  try {
    const response = await fetch("/spotify/recent");
    if (!response.ok) {
      throw new Error(`Failed to fetch recent song: ${response.statusText}`);
    }

    const track: SpotifyTrack = await response.json();
    const artistsHtml = track.artists
      .map((a) => `<a href="${a.url}" target="_blank">${a.name}</a>`)
      .join(", ");
    const playedAt = new Date(track.played_at).toLocaleString();

    container.innerHTML = `
      <div class="spotify-track">
        <a href="${track.url}" target="_blank">
          <img src="${track.image}" alt="${track.name} Album Art" />
        </a>
        <div class="spotify-info">
          <span class="track-name">
            <a href="${track.url}" target="_blank">${track.name}</a>
          </span>
          <span class="artist-name">${artistsHtml}</span>
          <span class="played-at">Last played: ${playedAt}</span>
        </div>
        <div class="most-recent-label">Most recent song</div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching recent song:", error);
    container.innerHTML = `<p>Activity log currently unavailable.</p>`;
  }
}

fetchRecentSong();


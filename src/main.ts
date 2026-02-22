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

interface StravaActivity {
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  type: string;
  start_date: string;
  id: number;
  summary_polyline?: string;
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function generateSvgPath(points: [number, number][]): string {
  if (points.length === 0) return "";

  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const width = maxLng - minLng;
  const height = maxLat - minLat;
  const maxDim = Math.max(width, height, 0.0001); // Minimum dimension to prevent division by zero or invisible paths
  
  const viewBoxSize = 100;
  const padding = 10;
  const scale = (viewBoxSize - 2 * padding) / maxDim;

  const getX = (lng: number) => padding + (lng - minLng) * scale + (maxDim - width) * scale / 2;
  const getY = (lat: number) => viewBoxSize - (padding + (lat - minLat) * scale + (maxDim - height) * scale / 2);

  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p[1]).toFixed(2)} ${getY(p[0]).toFixed(2)}`).join(" ");
}

async function fetchRecentRun() {
  const container = document.getElementById("strava-activity");
  if (!container) return;

  try {
    const response = await fetch("/strava/recent");
    if (!response.ok) {
      throw new Error(`Failed to fetch recent run: ${response.statusText}`);
    }

    const activity: StravaActivity = await response.json();
    const miles = activity.distance / 1609.344;
    const paceSecondsPerMile = activity.moving_time / miles;
    const paceMinutes = Math.floor(paceSecondsPerMile / 60);
    const paceSeconds = Math.round(paceSecondsPerMile % 60);
    const formattedPace = `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")}/mi`;
    const formattedDistance = `${miles.toFixed(2)} mi`;
    const startDate = new Date(activity.start_date).toLocaleString();

    let stravaIconContent = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--orange)" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM10.267 7.728l-2.088-4.116-2.088 4.116h-3.065L8.179 17.9l5.15-10.172h-3.062z" />
      </svg>
    `;

    if (activity.summary_polyline) {
      const points = decodePolyline(activity.summary_polyline);
      const path = generateSvgPath(points);
      stravaIconContent = `
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="${path}" stroke="var(--orange)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    }

    container.innerHTML = `
      <div class="strava-activity">
        <div class="strava-icon">
          ${stravaIconContent}
        </div>
        <div class="strava-info">
          <span class="activity-name">
            <a href="https://www.strava.com/activities/${activity.id}" target="_blank">${activity.name}</a>
          </span>
          <span class="activity-stats">${formattedDistance} • ${formattedPace} • ${activity.type}</span>
          <span class="activity-date">Activity date: ${startDate}</span>
        </div>
        <div class="most-recent-label strava-label">Most recent run</div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching recent run:", error);
    container.innerHTML = `<p>Run activity currently unavailable.</p>`;
  }
}

fetchRecentSong();
fetchRecentRun();


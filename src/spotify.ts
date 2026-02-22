export interface SpotifyEnv {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}

export interface SpotifyTrack {
  name: string;
  artists: { name: string; url: string }[];
  image: string;
  url: string;
  played_at: string;
}

async function getAccessToken(env: SpotifyEnv) {
  const clientID = env.SPOTIFY_CLIENT_ID?.trim().replace(/^"|"$/g, "");
  const clientSecret = env.SPOTIFY_CLIENT_SECRET?.trim().replace(/^"|"$/g, "");
  const refreshToken = env.SPOTIFY_REFRESH_TOKEN?.trim().replace(/^"|"$/g, "");

  if (!clientID || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify credentials in environment");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const auth = btoa(`${clientID}:${clientSecret}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`DEBUG: Spotify Token Error (${response.status}):`, errorBody);
    throw new Error(`Failed to refresh token: ${response.statusText} (${response.status})`);
  }

  const data: any = await response.json();
  return data.access_token as string;
}

export async function getRecentTrack(env: SpotifyEnv): Promise<SpotifyTrack | null> {
  const accessToken = await getAccessToken(env);
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=1",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recent track: ${response.statusText}`);
  }

  const data: any = await response.json();
  if (!data.items || data.items.length === 0) {
    return null;
  }

  const item = data.items[0];
  const track = item.track;

  return {
    name: track.name,
    artists: track.artists.map((a: any) => ({
      name: a.name,
      url: a.external_urls.spotify,
    })),
    image: track.album.images[0].url,
    url: track.external_urls.spotify,
    played_at: item.played_at,
  };
}

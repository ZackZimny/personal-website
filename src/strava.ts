export interface StravaEnv {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_REFRESH_TOKEN: string;
}

export interface StravaActivity {
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  type: string;
  start_date: string;
  id: number;
  summary_polyline?: string;
}

async function getAccessToken(env: StravaEnv) {
  const clientID = env.STRAVA_CLIENT_ID?.trim().replace(/^"|"$/g, "");
  const clientSecret = env.STRAVA_CLIENT_SECRET?.trim().replace(/^"|"$/g, "");
  const refreshToken = env.STRAVA_REFRESH_TOKEN?.trim().replace(/^"|"$/g, "");

  if (!clientID || !clientSecret || !refreshToken) {
    throw new Error("Missing Strava credentials in environment");
  }

  const params = new URLSearchParams();
  params.append("client_id", clientID);
  params.append("client_secret", clientSecret);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    body: params,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`DEBUG: Strava Token Error (${response.status}):`, errorBody);
    throw new Error(`Failed to refresh Strava token: ${response.statusText} (${response.status})`);
  }

  const data: any = await response.json();
  return data.access_token as string;
}

export async function getRecentActivity(env: StravaEnv): Promise<StravaActivity | null> {
  const accessToken = await getAccessToken(env);
  // Fetch more to ensure we find a run with GPS data
  const response = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=10",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recent Strava activity: ${response.statusText}`);
  }

  const data: any = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // Find the most recent "Run" that has map data
  let activity = data.find((a: any) => a.type === "Run" && a.map?.summary_polyline);
  
  // If no run found, find ANY activity with map data
  if (!activity) {
    activity = data.find((a: any) => a.map?.summary_polyline);
  }

  // If still no activity with map data, fall back to the most recent one
  if (!activity) {
    activity = data[0];
  }

  return {
    name: activity.name,
    distance: activity.distance,
    moving_time: activity.moving_time,
    elapsed_time: activity.elapsed_time,
    type: activity.type,
    start_date: activity.start_date,
    id: activity.id,
    summary_polyline: activity.map?.summary_polyline,
  };
}

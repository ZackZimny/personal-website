import { getRecentTrack, type SpotifyEnv } from "./spotify.ts";
import { getRecentActivity, type StravaEnv } from "./strava.ts";

interface Env extends SpotifyEnv, StravaEnv {
  CHAT_STORAGE: any; // Using any to avoid KVNamespace type error for now, or you can use @cloudflare/workers-types
  ASSETS?: {
    fetch: typeof fetch;
  };
}

interface ChatMessage {
  name: string;
  message: string;
  timestamp: number;
}

function sanitize(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cache = (caches as any).default;

    // Handle Chat API route
    if (url.pathname === "/api/chat") {
      if (request.method === "GET") {
        const messages = await env.CHAT_STORAGE.get("messages", { type: "json" }) as ChatMessage[] || [];
        return new Response(JSON.stringify(messages), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (request.method === "POST") {
        try {
          const body: any = await request.json();
          const name = body.name.trim();
          const message = body.message.trim();

          if (!name || !message) {
            return new Response("Invalid request", { status: 400 });
          }

          const newMessage: ChatMessage = {
            name: sanitize(name.substring(0, 50)),
            message: sanitize(message.substring(0, 500)),
            timestamp: Date.now(),
          };

          const messages = await env.CHAT_STORAGE.get("messages", { type: "json" }) as ChatMessage[] || [];
          messages.unshift(newMessage);
          
          // Keep only the last 50 messages
          if (messages.length > 50) {
            messages.pop();
          }

          await env.CHAT_STORAGE.put("messages", JSON.stringify(messages));
          return new Response(JSON.stringify(newMessage), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response("Error processing request", { status: 500 });
        }
      }
    }

    // Handle Spotify API route
    if (url.pathname === "/spotify/recent") {
      try {
        const track = await getRecentTrack(env);
        if (!track) {
          return new Response(JSON.stringify({ error: "No recent tracks found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify(track), {
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate" 
          },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle Strava API route
    if (url.pathname === "/strava/recent") {
      const cacheMatch = await cache?.match(request);
      if (cacheMatch) return cacheMatch;

      try {
        const activity = await getRecentActivity(env);
        if (!activity) {
          return new Response(JSON.stringify({ error: "No recent activities found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const response = new Response(JSON.stringify(activity), {
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=3600" 
          },
        });

        if (cache) await cache.put(request, response.clone());
        return response;
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Static assets fall-through
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);

      // If asset not found, return 404 page
      if (response.status === 404) {
        const errorPage = await env.ASSETS.fetch(new URL("/404.html", url.origin).toString());
        return new Response(errorPage.body, {
          status: 404,
          headers: errorPage.headers,
        });
      }

      return response;
    }

    // In local dev without ASSETS, we can try to fetch the 404 page from the origin
    const errorPageResponse = await fetch(new URL("/404.html", url.origin).toString());
    if (errorPageResponse.ok) {
      return new Response(errorPageResponse.body, {
        status: 404,
        headers: errorPageResponse.headers,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};


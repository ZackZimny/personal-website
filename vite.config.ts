import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    host: "127.0.0.1",
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            main: "index.html",
            chat: "chat.html",
            friends: "friends.html",
            photos: "photos.html",
            projects: "projects.html",
            blog: "blog.html",
            music: "music.html",
          },
        },
      },
    },
  },
});

import { onRequestGet as __api_announcements_js_onRequestGet } from "/workspaces/HIMAWARI-CLAN/functions/api/announcements.js"
import { onRequestPost as __api_announcements_js_onRequestPost } from "/workspaces/HIMAWARI-CLAN/functions/api/announcements.js"
import { onRequestGet as __api_bracket_js_onRequestGet } from "/workspaces/HIMAWARI-CLAN/functions/api/bracket.js"
import { onRequestPost as __api_bracket_js_onRequestPost } from "/workspaces/HIMAWARI-CLAN/functions/api/bracket.js"
import { onRequestGet as __api_roster_js_onRequestGet } from "/workspaces/HIMAWARI-CLAN/functions/api/roster.js"

export const routes = [
    {
      routePath: "/api/announcements",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_announcements_js_onRequestGet],
    },
  {
      routePath: "/api/announcements",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_announcements_js_onRequestPost],
    },
  {
      routePath: "/api/bracket",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_bracket_js_onRequestGet],
    },
  {
      routePath: "/api/bracket",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_bracket_js_onRequestPost],
    },
  {
      routePath: "/api/roster",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_roster_js_onRequestGet],
    },
  ]
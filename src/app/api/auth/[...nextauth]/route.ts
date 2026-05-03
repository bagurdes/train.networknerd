// Auth.js v5 — exposes the GET/POST handlers under /api/auth/*
// This is the only route handler in the codebase that we don't author —
// it's a thin re-export of Auth.js's built-in handlers object.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

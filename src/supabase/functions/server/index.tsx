import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7771b72b/health", (c) => {
  return c.json({ status: "ok" });
});

// Comment endpoints for onboarding overlay
app.post("/make-server-7771b72b/comments", async (c) => {
  try {
    const body = await c.req.json();
    const { page, comment, timestamp, stepId, userAccessCode } = body;

    if (!page || !comment) {
      return c.json({ error: "Page and comment are required" }, 400);
    }

    // Generate a unique key for the comment
    const commentId = `comment:${page}:${Date.now()}`;
    
    // Store comment with metadata including user identifier
    await kv.set(commentId, {
      page,
      comment,
      timestamp: timestamp || new Date().toISOString(),
      stepId: stepId || null,
      userAccessCode: userAccessCode || 'UNKNOWN',
    });

    return c.json({ 
      success: true, 
      commentId,
      message: "Comment saved successfully" 
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    return c.json({ 
      error: "Failed to save comment", 
      details: error.message 
    }, 500);
  }
});

// Get comments for a specific page
app.get("/make-server-7771b72b/comments/:page", async (c) => {
  try {
    const page = c.req.param("page");
    
    if (!page) {
      return c.json({ error: "Page parameter is required" }, 400);
    }

    // Get all comments for this page
    const comments = await kv.getByPrefix(`comment:${page}:`);

    return c.json({ 
      success: true, 
      comments: comments || [] 
    });
  } catch (error) {
    console.error("Error retrieving comments:", error);
    return c.json({ 
      error: "Failed to retrieve comments", 
      details: error.message 
    }, 500);
  }
});

// Get all comments (admin view)
app.get("/make-server-7771b72b/comments", async (c) => {
  try {
    // Get all comments
    const comments = await kv.getByPrefix("comment:");

    return c.json({ 
      success: true, 
      comments: comments || [] 
    });
  } catch (error) {
    console.error("Error retrieving all comments:", error);
    return c.json({ 
      error: "Failed to retrieve comments", 
      details: error.message 
    }, 500);
  }
});

Deno.serve(app.fetch);
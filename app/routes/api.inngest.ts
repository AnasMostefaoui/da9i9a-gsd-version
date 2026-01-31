/**
 * Inngest Serve Handler
 *
 * This route serves Inngest functions and handles event processing.
 * Both GET (registration/introspection) and POST (event handling) are needed.
 *
 * Route: /api/inngest
 *
 * @see https://www.inngest.com/docs/learn/serving-inngest-functions
 */
import { serve } from "inngest/remix";
import { inngest } from "~/inngest/client";
import { functions } from "~/inngest/functions";

const handler = serve({
  client: inngest,
  functions,
});

// React Router 7 uses loader for GET, action for POST
export { handler as action, handler as loader };

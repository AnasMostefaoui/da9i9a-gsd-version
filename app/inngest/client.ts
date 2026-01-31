import { Inngest, EventSchemas } from "inngest";
import type { Events } from "./types";

export const inngest = new Inngest({
  id: "salla-da9i9a",
  schemas: new EventSchemas().fromRecord<Events>(),
});

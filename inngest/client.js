import { Inngest } from "inngest";
import { INNGEST_EVENT_KEY } from "../configs/server.config.js";

export const inngest = new Inngest({
  id: "ticketing-system",
  eventKey: INNGEST_EVENT_KEY,
});

import { Inngest } from "inngest";

import { INNGEST_EVENT_KEY , INNGEST_SIGNING_KEY} from "../configs/server.config.js";

export const inngest = new Inngest({
  id: "ticketing-system",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: Iprocess.env.INNGEST_SIGNING_KEY,
  environment: process.env.NODE_ENV === "production" ? "prod" : "dev",
});

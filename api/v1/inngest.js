import { serve } from "inngest/express";

import { inngest } from "../../inngest/client.js";
import { onTicketCreated } from "../../inngest/functions/onTicketCreate.js";

console.log("Inngest serverless function loaded");


export default serve({
  client: inngest,
  functions: [onTicketCreated],
});

import { serve } from "inngest/express";
import { onTicketCreated } from "../../inngest/functions/onTicketCreate.js";
import { inngest } from "../../inngest/client.js";

console.log("Inngest serverless function loaded");


export default serve({
  client: inngest,
  functions: [onTicketCreated],
});

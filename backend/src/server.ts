import { app } from "./app";
import { config } from "./config";

app.listen(config.port, () => {
  console.log(`gangster-bot-brain listening on port ${config.port} (${config.nodeEnv})`);
});

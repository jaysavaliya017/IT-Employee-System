import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { initMessagingSocket } from './socket/messagingSocket';

const PORT = config.port;
const httpServer = createServer(app);

initMessagingSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  ProAttend Server is running!`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Frontend URL: ${config.frontendUrl}`);
  console.log(`========================================\n`);
});

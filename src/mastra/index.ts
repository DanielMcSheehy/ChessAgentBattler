import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { chessWhiteAgent } from './agents/chess-white-agent';
import { chessBlackAgent } from './agents/chess-black-agent';
import { chessAdvisorAgent } from './agents/chess-advisor-agent';

export const mastra = new Mastra({
  agents: { chessWhiteAgent, chessBlackAgent, chessAdvisorAgent },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    enabled: false,
  },
  observability: {
    default: { enabled: true },
  },
});

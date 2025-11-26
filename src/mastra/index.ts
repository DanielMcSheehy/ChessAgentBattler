import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { chessWhiteAgent } from './agents/chess-white-agent';
import { chessBlackAgent } from './agents/chess-black-agent';
import { chessAdvisorAgent } from './agents/chess-advisor-agent';
import { battleshipPlayer1Agent } from './agents/battleship-player1-agent';
import { battleshipPlayer2Agent } from './agents/battleship-player2-agent';

export const mastra = new Mastra({
  agents: {
    chessWhiteAgent,
    chessBlackAgent,
    chessAdvisorAgent,
    battleshipPlayer1Agent,
    battleshipPlayer2Agent,
  },
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

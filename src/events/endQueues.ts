import Event, { EventNameType } from ".";
import { GameModel } from "../models/game";

export default class EndQueues extends Event {
  eventName: EventNameType = "ready";

  async handle() {
    await GameModel.deleteMany({
      createdAt: { $lte: new Date(new Date().getTime() - 30 * 60 * 1000) },
    });
    setInterval(async () => {
      await GameModel.deleteMany({
        createdAt: { $lte: new Date(new Date().getTime() - 30 * 60 * 1000) },
      });
    }, 10 * 60 * 1000);
  }
}

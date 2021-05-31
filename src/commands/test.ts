import { Message } from "discord.js";
import Command from ".";
import { CarModel } from "../models/car";
import { GameModel } from "../models/game";
import { RacerModel } from "../models/racer";
import embeds from "../utils/embeds";

export default class TestCommand extends Command {
  cmdName = "test";
  description = "Test";

  async run(message: Message) {
    const game = await GameModel.findOne({
      "userOne.racerId": message.author.id,
    });
    message.channel.send(embeds.race(game.userOne, game.userTwo));
  }
}

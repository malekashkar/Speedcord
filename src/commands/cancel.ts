import { Message } from "discord.js";
import Command from ".";
import Configuration from "../config";
import { GameModel } from "../models/game";
import embeds from "../utils/embeds";

export default class CancelCommand extends Command {
  cmdName = "cancel";
  description = "Cancel a game that you have started if no one has joined yet.";

  async run(message: Message) {
    const currentGames = await GameModel.find({
      "userOne.racerId": message.author.id,
      userTwo: { $exists: false },
    });
    if (currentGames.length) {
      for (const game of currentGames) {
        game.deleteOne();
      }
      return message.channel.send(
        embeds.normal(
          `Race Queue Ended`,
          `The race that you had open has been cancelled!`
        )
      );
    } else {
      const activeGame = await GameModel.find({
        $or: [
          { "userOne.racerId": message.author.id },
          { "userTwo.racerId": message.author.id },
        ],
        userOne: { $exists: true },
        userTwo: { $exists: true },
      });
      if (activeGame.length) {
        return message.channel.send(
          embeds.error(
            `You're currently in an active race, you may not cancel it!`
          )
        );
      } else {
        return message.channel.send(
          embeds.error(
            `You aren't in a race currently, you may join or start one using the \`${Configuration.prefix}play\` command.`
          )
        );
      }
    }
  }
}

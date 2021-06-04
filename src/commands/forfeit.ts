import { Message } from "discord.js";
import Command from ".";
import { GameModel } from "../models/game";
import embeds from "../utils/embeds";

export default class ForfeitCommand extends Command {
  cmdName = "forfeit";
  description = "Not doing so well? Drop the race whenever you need.";

  async run(message: Message) {
    const races = await GameModel.find({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
      userOne: { $exists: true },
      userTwo: { $exists: true },
    });
    if (!races.length)
      return message.channel.send(
        embeds.error(
          `You're not in a race currently! You may ony forfeit if you are in one.`
        )
      );

    for (const race of races) {
      const localRace = this.client.races.get(race.userOne.racerId);
      if (localRace) localRace.endRace(message.author.id);
    }

    return message.channel.send(
      embeds.normal(
        `Race Forfeited`,
        `You have successfully forfeited your race! Sad to see you take a loss...`
      )
    );
  }
}

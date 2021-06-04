import { Message } from "discord.js";
import Command from ".";
import { RacerModel } from "../models/racer";
import embeds from "../utils/embeds";

export default class ForfeitCommand extends Command {
  cmdName = "forfeit";
  description = "Not doing so well? Drop the race whenever you need.";

  async run(message: Message) {
    const races = await RacerModel.find({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
    });
    if (!races.length)
      return message.channel.send(
        embeds.error(
          `You're not in a race currently! You may ony forfeit if you are in one.`
        )
      );

    for (const race of races) {
      await race.deleteOne();

      // Delete the races from this.client.races[]
      // Edit the race messages saying its a forfeit
      // Give the reward to the winner
    }

    return message.channel.send(
      embeds.normal(
        `Race Forfeited`,
        `You have successfully forfeited your race! Sad to see you take a loss...`
      )
    );
  }
}

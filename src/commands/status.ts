import { Message } from "discord.js";
import Command from ".";
import { GameModel } from "../models/game";
import { RacerModel } from "../models/racer";
import embeds from "../utils/embeds";

export default class StatusCommand extends Command {
  cmdName = "status";
  description = "Check your currently racer status/location on Speedcord.";
  aliases = ["location"];

  async run(message: Message) {
    const racerProfile = await RacerModel.findOne({
      userId: message.author.id,
    });
    if (!racerProfile) return message.channel.send(embeds.start());

    const activeGames = await GameModel.find({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
    });

    const location = activeGames[0]
      ? activeGames[0].status === "CREATED"
        ? `queue`
        : `casual race`
      : `lobby`;

    const statusEmbed = embeds.normal(
      `🗺️ ${racerProfile.displayName || racerProfile.username}'s Status`,
      `You are currently in a **${location}**.`
    );
    return message.channel.send(statusEmbed);
  }
}

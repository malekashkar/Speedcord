import { DocumentType } from "@typegoose/typegoose";
import { stripIndents } from "common-tags";
import { Message } from "discord.js";
import Command from ".";
import cars from "../cars";
import { ArchivedGameModel } from "../models/archivedGame";
import { Racer, RacerModel } from "../models/racer";
import embeds from "../utils/embeds";

export default class ProfileCommand extends Command {
  cmdName = "profile";
  description = "Check your own or other users Speedcord profile's.";

  async run(message: Message, args: string[]) {
    const mention = message.mentions?.users?.size
      ? message.mentions.users.first()
      : null;
    const username = args[0];

    let racerProfile: DocumentType<Racer>;
    if (!mention && !username) {
      racerProfile = await RacerModel.findOne({
        userId: message.author.id,
      });
    } else if (mention) {
      racerProfile = await RacerModel.findOne({
        userId: mention.id,
      });
    } else if (username) {
      racerProfile = await RacerModel.findOne({
        username,
      });
    }

    if (!racerProfile)
      return message.channel.send(
        embeds.error(`There was an error finding the racer you are requesting!`)
      );

    const completedRaces = await ArchivedGameModel.countDocuments({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
    });
    const user = await this.client.users.fetch(racerProfile.userId);
    const carDetails = cars.find((x) => x.carId === racerProfile.selectedCarId);
    const racerEmbedProfile = embeds
      .empty()
      .setTitle(
        `👤 ${racerProfile.displayName || racerProfile.username}'s Profile`
      )
      .addField(
        `Information`,
        stripIndents`**Display Name** ${racerProfile.displayName || `None`}
      **Username** ${racerProfile.username}
      **Selected Car** ${carDetails ? carDetails.carName : `None`}`,
        true
      )
      .addField(
        `Statistics`,
        stripIndents`**Races Completed** ${completedRaces}
      **Experience** ${racerProfile.experience}
      **Credits** ${racerProfile.credits}`,
        true
      )
      .setThumbnail(user?.displayAvatarURL({ dynamic: true }))
      .setFooter(`Racer ID: ${racerProfile.userId}`);
    return message.channel.send(racerEmbedProfile);
  }
}

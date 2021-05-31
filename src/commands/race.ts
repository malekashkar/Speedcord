import Command from ".";
import { CarModel } from "../models/car";
import { Message, TextChannel } from "discord.js";
import { createSignupProcess } from "../utils/signup";
import { GameModel } from "../models/game";
import { Racer, RacerModel } from "../models/racer";
import embeds from "../utils/embeds";
import { playGame, searchForGame, joinRace } from "../utils/gameFunction";
import { sleep } from "../utils";
import cars from "../cars";
import Configuration from "../config";

export default class PlayCommand extends Command {
  cmdName = "race";
  description =
    "Enter a public race against oponents and possibly take home a victory!";
  aliases = ["play"];

  async run(message: Message) {
    const started = await CarModel.findOne({
      racerId: message.author.id,
    });
    if (!started)
      return createSignupProcess(
        message.channel as TextChannel,
        message.author
      );

    const onlineGame = await GameModel.find({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
    });
    if (onlineGame.length)
      return message.channel.send(
        embeds.error(
          `You're already in a race, please continue it before beginning a new one!`
        )
      );

    const loadingMesage = await message.channel.send(
      embeds.normal(
        `Searching for race...`,
        `We're currently searching for a race you may enter!`
      )
    );

    const racerProfile = await RacerModel.findOne({
      userId: message.author.id,
    });

    const carDetails = cars.find((x) => x.carId === racerProfile.selectedCarId);
    if (!carDetails)
      return loadingMesage.edit(
        embeds.error(
          `Please select a car from your garage with the \`${Configuration.prefix}select\` command!`
        )
      );

    const raceGame = await searchForGame(message.author, racerProfile);
    if (raceGame) {
      await sleep(1500);
      await loadingMesage.edit(
        embeds.normal(
          `Race Started`,
          `The race has been started, watch your DM's for your turn to play!`
        )
      );

      raceGame.status = "STARTED";
      await raceGame.save();

      raceGame.userTwo = {
        racerId: message.author.id,
        racerExperience: racerProfile.experience,
        racerDisplayName: racerProfile.displayName || racerProfile.username,
        carBaseSpeed: carDetails.baseSpeed,
        carName: carDetails.carName,
      };

      return joinRace(message.channel as TextChannel, this.client, raceGame);
    } else {
      await GameModel.create({
        createdAt: new Date(),
        userOne: {
          racerId: message.author.id,
          racerExperience: racerProfile.experience,
          racerDisplayName: racerProfile.displayName || racerProfile.username,
          carBaseSpeed: carDetails.baseSpeed,
          carName: carDetails.carName,
        },
      });

      await sleep(1500);
      return loadingMesage.edit(
        embeds.normal(
          `Race Created`,
          `**Looks like no races are currently available!** Your own race has been created, please be patient until someone else queue's with you.`
        )
      );
    }
  }
}

import { replaceStringTransformer } from "common-tags";
import { Message } from "discord.js";
import Command from ".";
import cars from "../cars";
import Configuration from "../config";
import { CarModel } from "../models/car";
import { GameModel } from "../models/game";
import { RacerModel } from "../models/racer";
import embeds from "../utils/embeds";

export default class SelectCommand extends Command {
  cmdName = "select";
  description = "Select a car from your garage to use during races.";

  async run(message: Message, args: string[]) {
    const racerCarsAmount = await CarModel.countDocuments({
      racerId: message.author.id,
    });
    if (!racerCarsAmount) return message.channel.send(embeds.start());

    const activeGame = await GameModel.find({
      $or: [
        { "userOne.racerId": message.author.id },
        { "userTwo.racerId": message.author.id },
      ],
    });
    if (activeGame.length)
      return message.channel.send(
        embeds.error(`You're not allowed to select a new car while in a race!`)
      );

    const carIndex = !isNaN(parseInt(args[0])) ? parseInt(args[0]) - 1 : null;
    if (carIndex === null)
      return message.channel.send(
        embeds.error(
          `Please provide the ID of the car you would like to select. To check what cars you have available, use the \`${Configuration.prefix}garage\` command!`
        )
      );

    const racerCars = await CarModel.find({
      racerId: message.author.id,
    });
    if (racerCars.length <= carIndex)
      return message.channel.send(
        embeds.error(
          `The car ID **${carIndex + 1}** does not exist in your garage!`
        )
      );

    const selectedCar = racerCars[carIndex];
    const carDetails = cars.find((x) => x.carId === selectedCar.carId);
    const racerProfile = await RacerModel.findOne({
      userId: message.author.id,
    });
    if (racerProfile) {
      racerProfile.selectedCarId = selectedCar.carId;
      await racerProfile.save();

      return message.channel.send(
        embeds
          .normal(
            `Car Selected`,
            `You selected your **${carDetails.carName}**.`
          )
          .setThumbnail(carDetails.logoUrl)
      );
    }
  }
}

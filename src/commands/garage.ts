import { stripIndents } from "common-tags";
import { Message } from "discord.js";
import Command from ".";
import cars from "../cars";
import { CarModel } from "../models/car";
import { RacerModel } from "../models/racer";
import { commafy } from "../utils";
import embeds from "../utils/embeds";
import Paginator from "../utils/paginator";

export default class GarageCommand extends Command {
  cmdName = "garage";
  description = "See your current cars and other customizable.";
  aliases = ["cars"];

  async run(message: Message, args: string[]) {
    const page = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 0;
    const racerCarsAmount = await CarModel.countDocuments({
      racerId: message.author.id,
    });

    const pageCount = Math.ceil(racerCarsAmount / 6);
    if (!racerCarsAmount) return message.channel.send(embeds.start());

    const racer = await RacerModel.findOne({
      userId: message.author.id,
    });
    if (!racer) return message.channel.send(embeds.start());

    const paginator = new Paginator(
      message,
      pageCount,
      async (pageIndex) => {
        const racerCars = await CarModel.find({
          racerId: message.author.id,
        })
          .skip(pageIndex * 6)
          .limit(6);
        const carFields = racerCars.map((car, i) => {
          const carDetails = cars.find((x) => x.carId === car.carId);
          return {
            name: `${pageIndex * 6 + i + 1} ${carDetails.carName}`,
            value: stripIndents`**Horsepower** ${commafy(carDetails.baseSpeed)}
            **Value** $${commafy(carDetails.price)}`,
            inline: true,
          };
        });

        return embeds
          .empty()
          .setTitle(`🏎️ ${racer.displayName || racer.username} Garage`)
          .addFields(carFields)
          .setFooter("Page PAGE of TOTAL_PAGES");
      },
      page && page <= pageCount ? page - 1 : 0
    );

    await paginator.start();
  }
}

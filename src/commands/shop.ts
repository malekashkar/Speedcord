import { stripIndents } from "common-tags";
import { Message } from "discord.js";
import Command from ".";
import cars from "../cars";
import { commafy } from "../utils";
import embeds from "../utils/embeds";
import Paginator from "../utils/paginator";

export default class ShopCommand extends Command {
  cmdName = "shop";
  description = "Buy whatever your heart desires.";
  aliases = ["store"];

  async run(message: Message, args: string[]) {
    const page = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 0;
    const carsAmount = cars.length;
    const pageCount = Math.ceil(carsAmount / 9);

    const paginator = new Paginator(
      message,
      pageCount,
      async (pageIndex) => {
        const pageCars = cars.slice(pageIndex * 9, pageIndex * 9 + 9);
        const carFields = pageCars.map((car) => {
          const carDetails = cars.find((x) => x.carId === car.carId);
          return {
            name: carDetails.carName,
            value: stripIndents`**Horsepower** ${commafy(carDetails.baseSpeed)}
            **Price** ${commafy(carDetails.price)}`,
            inline: true,
          };
        });

        return embeds
          .empty()
          .setTitle(`🛒 Car Shop`)
          .addFields(carFields)
          .setFooter("Page PAGE of TOTAL_PAGES");
      },
      page && page <= pageCount ? page - 1 : 0
    );

    await paginator.start();
  }
}

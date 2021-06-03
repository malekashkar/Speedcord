import { Message, TextChannel } from "discord.js";
import Command from ".";
import similarity from "string-similarity";
import cars, { Car } from "../cars";
import embeds from "../utils/embeds";
import config from "../config";
import { Racer, RacerModel } from "../models/racer";
import { CarModel } from "../models/car";
import { DocumentType } from "@typegoose/typegoose";

export default class BuyCommand extends Command {
  cmdName = "buy";
  description = "Purchase a car using it's name from the shop.";

  async run(message: Message, args: string[]) {
    const racerProfile = await RacerModel.findOne({
      userId: message.author.id,
    });
    if (!racerProfile) return message.channel.send(embeds.start());

    const carNames = cars.map((x) => x.carName.toLowerCase());
    const carName = args?.join(" ")?.toLowerCase();
    if (!carName)
      return message.channel.send(
        embeds.error(
          `Please provide the name of a car from the shop, \`${config.prefix}shop\`!`
        )
      );

    const similarStrings = similarity.findBestMatch(carName, carNames);
    if (!similarStrings?.bestMatch?.rating)
      return message.channel.send(
        embeds.error(`We could not find any car(s) with that name.`)
      );

    const ratedCars = similarStrings.ratings.filter((x) => x.rating > 0.25);
    if (!ratedCars) {
      return message.channel.send(
        embeds.error(`We could not find any car(s) similar to that name.`)
      );
    } else if (ratedCars.length === 1) {
      checkoutProcess(
        cars.find((x) => x.carName.toLowerCase() === ratedCars[0].target),
        racerProfile,
        message.channel as TextChannel
      );
    } else {
      const ratedCarsDetails = ratedCars
        .filter((x) => x.rating > 0.25)
        .sort((a, b) => b.rating - a.rating)
        .map((x) => cars.find((j) => j.carName.toLowerCase() === x.target));
      const carOptionsFormatted = ratedCarsDetails
        .map((x, i) => `${config.numberEmojis[i]} **${x.carName}**`)
        .join("\n");
      const carChoiceMessage = await message.channel.send(
        embeds.question(
          `Which car would you like to purchase?\n\n${carOptionsFormatted}`
        )
      );
      for (let i = 0; i < ratedCarsDetails.length; i++) {
        await carChoiceMessage.react(config.numberEmojis[i]);
      }

      const reactedEmojis = config.numberEmojis.slice(
        0,
        ratedCarsDetails.length
      );

      const carChoiceCollector = carChoiceMessage.createReactionCollector(
        (r, u) =>
          reactedEmojis.includes(r.emoji.name) && u.id === message.author.id,
        {
          max: 1,
          time: config.questionTime,
        }
      );

      carChoiceCollector.on("end", async (collected) => {
        if (collected?.first()?.emoji?.name) {
          checkoutProcess(
            ratedCarsDetails[
              reactedEmojis.indexOf(collected?.first()?.emoji?.name)
            ],
            racerProfile,
            message.channel as TextChannel
          );
        }
      });
    }
  }
}

async function checkoutProcess(
  chosenCar: Car,
  racerProfile: DocumentType<Racer>,
  channel: TextChannel
) {
  if (chosenCar.price > racerProfile.credits)
    return channel.send(
      embeds.error(
        `You don't have enough credits to purchase a **${chosenCar.carName}**.`
      )
    );

  const confirmationMessage = await channel.send(
    embeds.question(
      `Are you sure you would like to purchase the **${chosenCar.carName}** for **${chosenCar.price}** credits?`
    )
  );

  await confirmationMessage.react("✅");
  await confirmationMessage.react("❎");

  const confirmationCollector = confirmationMessage.createReactionCollector(
    (r, u) =>
      (r.emoji.name === "✅" || r.emoji.name === "❎") &&
      u.id === racerProfile.userId,
    {
      max: 1,
      time: config.questionTime,
    }
  );

  confirmationCollector.on("end", async (collected) => {
    const emoji = collected?.first()?.emoji?.name;
    if (emoji === "✅") {
      racerProfile.credits -= chosenCar.price;
      await racerProfile.save();

      await CarModel.create({
        racerId: racerProfile.userId,
        carId: chosenCar.carId,
      });

      return channel.send(
        embeds.normal(
          `Purchase Complete`,
          `You have successfully purchased a **${chosenCar.carName}** from the car shop!`
        )
      );
    } else if (emoji === "❎") {
      return channel.send(
        embeds.normal(
          `Purchase Cancelled`,
          `You have cancelled your purchased on the **${chosenCar.carName}**!`
        )
      );
    }
  });
}

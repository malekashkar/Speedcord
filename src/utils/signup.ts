import cars from "../cars";
import embeds from "./embeds";
import config from "../config";

import { carTable } from ".";
import { CarModel } from "../models/car";
import { RacerModel } from "../models/racer";
import { Message, MessageReaction, TextChannel, User } from "discord.js";

export async function createSignupProcess(channel: TextChannel, author: User) {
  const signUpQuestion = await channel.send(
    embeds.question(
      `You haven't signed up to be part of Speedcord in the past, would you like to sign up now?`
    )
  );

  await signUpQuestion.react("🟢");
  await signUpQuestion.react("🔴");

  const signUpCollector = signUpQuestion.createReactionCollector(
    (reaction: MessageReaction, user: User) =>
      user.id === author.id &&
      (reaction.emoji.name === "🟢" || reaction.emoji.name === "🔴"),
    {
      max: 1,
      time: config.questionTime,
    }
  );

  signUpCollector.on("end", async (collected) => {
    signUpQuestion.delete();

    const emoji = collected?.first()?.emoji?.name;
    if (!emoji) return;

    if (emoji === "🟢") {
      return createUsernameProcess(channel, author);
    } else if (emoji === "🔴") {
      return channel.send(
        embeds.normal(
          `Sign-Up Process Ended`,
          `If you would like to sign up in the future, simply use the \`${config.prefix}play\` command again.`
        )
      );
    }
  });
}

export async function createUsernameProcess(
  channel: TextChannel,
  author: User
) {
  const usernameQuestion = await channel.send(
    embeds.question(`What would you like to call your driver?`)
  );

  const usernameCollector = channel.createMessageCollector(
    (m: Message) => m.author.id === author.id,
    {
      max: 1,
      time: config.questionTime,
    }
  );

  usernameCollector.on("end", async (collected) => {
    usernameQuestion.delete();

    const username = collected?.first()?.content?.trim();
    if (!username) return;

    const usernameTaken = await RacerModel.findOne({
      username: username.toLowerCase(),
    });
    if (usernameTaken) {
      const retryMessage = await channel.send(
        embeds.error(`That username is already taken. Please try again!`)
      );
      createUsernameProcess(channel, author);
      await retryMessage.delete({ timeout: 10 * 1000 });
      return;
    } else if (!/^[a-z0-9_]*$/gm.test(username.toLowerCase())) {
      const retryMessage = await channel.send(
        embeds.error(
          `Usernames may only contain letters, numbers, and underscores. Please try again!`
        )
      );
      createUsernameProcess(channel, author);
      await retryMessage.delete({ timeout: 10 * 1000 });
      return;
    } else if (username.length > 15) {
      const retryMessage = await channel.send(
        embeds.error(
          `Usernames may only be up to 15 characters. Please try again!`
        )
      );
      createUsernameProcess(channel, author);
      await retryMessage.delete({ timeout: 10 * 1000 });
      return;
    } else {
      return pickCarProcess(channel, author, username);
    }
  });
}

export async function pickCarProcess(
  channel: TextChannel,
  author: User,
  displayName: string
) {
  const baseCars = cars
    .filter(
      (car) => car.price <= config.gameConfiguration.baseCarsMaxPrice
    )
    .slice(0, 3)
    .map((car, index) => {
      car.carName = `${config.numberEmojis[index]} ${car.carName}`;
      return car;
    });

  const carQuestion = await channel.send(
    embeds.question(
      `Which car would you like to begin with?\n\n${carTable(baseCars)}`,
      "DESCRIPTION"
    )
  );

  for (let i = 0; i < baseCars.length; i++) {
    await carQuestion.react(config.numberEmojis[i]);
  }

  const baseCarCollector = carQuestion.createReactionCollector(
    (reaction: MessageReaction, user: User) =>
      user.id === author.id &&
      config.numberEmojis
        .slice(0, baseCars.length)
        .includes(reaction.emoji.name),
    {
      max: 1,
      time: config.questionTime,
    }
  );

  baseCarCollector.on("end", async (collected) => {
    carQuestion.delete();

    const emoji = collected?.first()?.emoji?.name;
    if (!emoji) return;

    const car = baseCars[config.numberEmojis.indexOf(emoji)];

    await RacerModel.create({
      userId: author.id,
      username: displayName.toLowerCase(),
      displayName,
    });
    await CarModel.create({
      racerId: author.id,
      carId: car.carId,
      tradable: false,
    });

    return channel.send(
      embeds.normal(
        `Sign-Up Process Complete`,
        `You have completed the sign up process **${displayName}**, welcome to **Speedcord**!\n*Note: In order to use the bot, you must have your DM's open!*`
      )
    );
  });
}

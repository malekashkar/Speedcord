import { DocumentType } from "@typegoose/typegoose";
import { Message, TextChannel, User } from "discord.js";
import Client from "..";
import Configuration from "../config";
import { ArchivedGameModel } from "../models/archivedGame";
import { Game, GameModel } from "../models/game";
import { Racer, RacerModel } from "../models/racer";
import embeds from "./embeds";

export async function searchForGame(
  author: User,
  racerProfile: DocumentType<Racer>,
  availableGames?: DocumentType<Game>[]
): Promise<DocumentType<Game>> {
  if (!availableGames?.length) {
    availableGames = await GameModel.find({
      status: "CREATED",
      "userOne.racerId": { $ne: author.id },
      "userOne.racerExperience": {
        $gte:
          racerProfile.experience -
          Configuration.gameConfiguration.queueExperienceDiversion,
        $lte:
          racerProfile.experience +
          Configuration.gameConfiguration.queueExperienceDiversion,
      },
      userTwo: { $exists: false },
    });
  }

  if (availableGames.length) {
    const raceGame =
      availableGames[Math.floor(Math.random() * availableGames.length)];
    const userOne = await author.client.users.fetch(raceGame.userOne.racerId);
    if (userOne) {
      return raceGame;
    } else {
      await raceGame.deleteOne();
      return await searchForGame(author, racerProfile, availableGames);
    }
  }
}

export async function joinRace(
  beginChannel: TextChannel,
  client: Client,
  game: DocumentType<Game>
) {
  try {
    const userOne = await client.users.fetch(game.userOne.racerId);
    const userTwo = await client.users.fetch(game.userTwo.racerId);

    const userOneMessage = await userOne.send(
      embeds.race(game.userOne, game.userTwo)
    );
    game.userOne.messageId = userOneMessage.id;

    const userTwoMessage = await userTwo.send(
      embeds.race(game.userOne, game.userTwo)
    );
    game.userTwo.messageId = userTwoMessage.id;

    await game.save();
    return playGame(client, game);
  } catch (err) {
    await game.deleteOne();
    console.log(err);
    beginChannel.send(
      embeds.normal(
        `Game Cancelled`,
        `The game was cancelled because one of the players had their DM's closed.`
      )
    );
  }
}

export async function playGame(client: Client, game: DocumentType<Game>) {
  try {
    const ticksPerUpdate = 5;
    const userOne = await client.users.fetch(game.userOne.racerId);
    const userTwo = await client.users.fetch(game.userTwo.racerId);

    const userOneMessage = await userOne.dmChannel.messages.fetch(
      game.userOne.messageId
    );
    const userTwoMessage = await userTwo.dmChannel.messages.fetch(
      game.userTwo.messageId
    );

    let someoneWon = false;
    const updateScoreInterval = setInterval(async () => {
      for (let i = 1; i <= ticksPerUpdate; i++) {
        if (
          game.userOne.horsepowerCompleted <
          Configuration.gameConfiguration.totalRaceHorsepower
        ) {
          game.userOne.ticksTaken += 1;
          game.userOne.horsepowerCompleted += game.userOne.carBaseSpeed;
        }

        if (
          game.userTwo.horsepowerCompleted <
          Configuration.gameConfiguration.totalRaceHorsepower
        ) {
          game.userTwo.ticksTaken += 1;
          game.userTwo.horsepowerCompleted += game.userTwo.carBaseSpeed;
        }

        if (
          game.userOne.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower ||
          (game.userTwo.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower &&
            !someoneWon)
        ) {
          // Someone won the race
          userOneMessage.edit(embeds.race(game.userOne, game.userTwo));
          userTwoMessage.edit(embeds.race(game.userOne, game.userTwo));
          someoneWon = true;
        }

        if (
          game.userOne.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower &&
          game.userTwo.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower &&
          someoneWon
        ) {
          // Game completely ended, move to archived
          endTheRace(client, game);
          clearInterval(updateScoreInterval);
          break;
        }

        if (i === ticksPerUpdate) {
          // Neither user won, just update the race positions
          userOneMessage.edit(embeds.race(game.userOne, game.userTwo));
          userTwoMessage.edit(embeds.race(game.userOne, game.userTwo));
        }
      }
    }, ticksPerUpdate * 1000);
  } catch (err) {
    await game.deleteOne();
    console.log(err);
  }
  // Every 5 seconds have a gear shift that they have 3 seconds to respond to
  // If they don't respond to the gear shift or get it wrong, add ticks * baseSpeed to total horsepower
  // If they do repsond to gear shift correctly, add (ticks * baseSpeed) + multiplier to total horsepower

  // If total horsepower is over 10k stop adding ticks to the user and wait for other user to finish
  // If the other user is not finished continue
  // If the other user is finished, check which user has less ticks, the one with the lower one wins
  // Update both players with the final embed with winners
  // Give the winner his prize and the loser his prize
}

export async function endTheRace(client: Client, game: DocumentType<Game>) {
  try {
    await ArchivedGameModel.create({
      userOne: game.userOne,
      userTwo: game.userTwo,
    });
    await game.deleteOne();

    const loserData =
      game.userOne.ticksTaken < game.userTwo.ticksTaken
        ? game.userTwo
        : game.userOne;
    const winnerData =
      game.userOne.ticksTaken < game.userTwo.ticksTaken
        ? game.userOne
        : game.userTwo;

    const creditsWon = 1000;
    const experienceWon = 5000;

    const winnerProfile = await RacerModel.findOne({
      userId: winnerData.racerId,
    });
    if (winnerProfile) {
      winnerProfile.credits += creditsWon;
      winnerProfile.experience += experienceWon;
      await winnerProfile.save();
    }

    const winnerUser = await client.users.fetch(winnerData.racerId);
    winnerUser.send(
      embeds.normal(
        `Race Won`,
        `You beat **${loserData.racerDisplayName}** by \`${
          loserData.ticksTaken - winnerData.ticksTaken
        }\` seconds. You've been rewarded with **${creditsWon} credits** and **${experienceWon} experience**!`
      )
    );

    const loserUser = await client.users.fetch(loserData.racerId);
    loserUser.send(
      embeds.normal(
        `Race Lost`,
        `Sadly you have lost the race to **${
          winnerData.racerDisplayName
        }** by \`${loserData.ticksTaken - winnerData.ticksTaken}\` seconds.`
      )
    );
  } catch (err) {
    await game.deleteOne();
    console.log(err);
  }

  // First find the winner of the game
  // 1: Find the amount of ticks taken to win the race
  // 2: The less amount of ticks the higher the price
  // 3: The prize cannot go above 1k or 5k
  // 4: Message the winner what they receive as a reward
}

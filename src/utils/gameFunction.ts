import { DocumentType } from "@typegoose/typegoose";
import { TextChannel, User } from "discord.js";
import { commafy } from ".";
import Client from "..";
import config from "../config";
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
          config.gameConfiguration.queueExperienceDiversion,
        $lte:
          racerProfile.experience +
          config.gameConfiguration.queueExperienceDiversion,
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
    const userOneGearShifts = Math.round(
      ((config.gameConfiguration.totalRaceHorsepower /
        game.userOne.carBaseSpeed) *
        5) /
        6 /
        6
    );

    const userTwoGearShifts = Math.round(
      ((config.gameConfiguration.totalRaceHorsepower /
        game.userTwo.carBaseSpeed) *
        5) /
        6 /
        6
    );

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
          config.gameConfiguration.totalRaceHorsepower
        ) {
          game.userOne.ticksTaken += 1;
          game.userOne.horsepowerCompleted += game.userOne.carBaseSpeed;
        }

        if (
          game.userTwo.horsepowerCompleted <
          config.gameConfiguration.totalRaceHorsepower
        ) {
          game.userTwo.ticksTaken += 1;
          game.userTwo.horsepowerCompleted += game.userTwo.carBaseSpeed;
        }

        if (
          game.userOne.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower ||
          (game.userTwo.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower &&
            !someoneWon)
        ) {
          // Someone won the race
          userOneMessage.edit(embeds.race(game.userOne, game.userTwo));
          userTwoMessage.edit(embeds.race(game.userOne, game.userTwo));
          someoneWon = true;
        }

        if (
          game.userOne.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower &&
          game.userTwo.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower &&
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

    if (game.userOne.ticksTaken === game.userTwo.ticksTaken) {
    } else {
      // Winner Information
      const winnerData =
        game.userOne.ticksTaken < game.userTwo.ticksTaken
          ? game.userOne
          : game.userTwo;

      const winnerCredits = Math.round(
        config.gameConfiguration.coinsWinDefault -
          winnerData.ticksTaken * 8
      );
      const winnerExperience = Math.round(
        config.gameConfiguration.experienceWinDefault -
          winnerData.ticksTaken * 40
      );

      const winnerProfile = await RacerModel.findOne({
        userId: winnerData.racerId,
      });
      if (winnerProfile) {
        winnerProfile.credits += winnerCredits;
        winnerProfile.experience += winnerExperience;
        await winnerProfile.save();
      }

      // Loser Information
      const loserData =
        game.userOne.ticksTaken < game.userTwo.ticksTaken
          ? game.userTwo
          : game.userOne;

      const loserCredits = Math.round(
        config.gameConfiguration.coinsLossDefault -
          loserData.ticksTaken * 0.9
      );
      const loserExperience = Math.round(
        config.gameConfiguration.experienceLossDefault -
          loserData.ticksTaken * 9
      );

      const loserProfile = await RacerModel.findOne({
        userId: loserData.racerId,
      });
      if (loserProfile) {
        loserProfile.credits += loserCredits;
        loserProfile.experience += loserExperience;
        await loserProfile.save();
      }

      // Winner Message
      const winnerUser = await client.users.fetch(winnerData.racerId);
      const winnerMessage = await winnerUser.dmChannel.messages.fetch(
        winnerData.messageId
      );
      winnerMessage.edit(
        embeds
          .race(game.userOne, game.userTwo)
          .setTitle(`Race Won`)
          .setDescription(
            `🎉 You beat **${loserData.racerDisplayName}** by \`${
              loserData.ticksTaken - winnerData.ticksTaken
            }\` seconds.`
          )
          .addField(
            `Rewards`,
            `**Credits** $${commafy(winnerCredits)}
          **Experience** ${commafy(winnerExperience)}`,
            true
          )
      );

      // Loser Message
      const loserUser = await client.users.fetch(loserData.racerId);
      const loserMessage = await loserUser.dmChannel.messages.fetch(
        loserData.messageId
      );
      loserMessage.edit(
        embeds
          .race(game.userOne, game.userTwo)
          .setTitle(`Race Lost`)
          .setDescription(
            `Sadly, you lost the race to **${
              winnerData.racerDisplayName
            }** by \`${loserData.ticksTaken - winnerData.ticksTaken}\` seconds.`
          )
          .addField(
            `Rewards`,
            `**Credits** $${commafy(loserCredits)}
          **Experience** ${commafy(loserExperience)}`,
            true
          )
      );
    }
  } catch (err) {
    await game.deleteOne();
    console.log(err);
  }
}

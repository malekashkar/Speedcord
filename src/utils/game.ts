import { DocumentType } from "@typegoose/typegoose";
import { TextChannel, User } from "discord.js";
import { commafy } from ".";
import Client from "..";
import config from "../config";
import Configuration from "../config";
import { ArchivedGameModel } from "../models/archivedGame";
import { Game, GameModel, RacerState } from "../models/game";
import { RacerModel } from "../models/racer";
import embeds from "./embeds";

export async function startMatchMaking(
  author: User,
  experience: number,
  availableGames?: DocumentType<Game>[]
): Promise<DocumentType<Game>> | null {
  if (!availableGames?.length) {
    availableGames = await GameModel.find({
      status: "CREATED",
      "userOne.racerId": { $ne: author.id },
      "userOne.racerExperience": {
        $gte:
          experience - Configuration.gameConfiguration.queueExperienceDiversion,
        $lte:
          experience + Configuration.gameConfiguration.queueExperienceDiversion,
      },
      userTwo: { $exists: false },
    });
    if (!availableGames) return null;
  }

  if (availableGames.length) {
    const raceGame =
      availableGames[Math.floor(Math.random() * availableGames.length)];
    const userOne = await author.client.users.fetch(raceGame.userOne.racerId);
    if (userOne) {
      return raceGame;
    } else {
      await raceGame.deleteOne();
      return await startMatchMaking(author, experience, availableGames);
    }
  }
}

export default class Games {
  lastMessageUpdateTime: number;
  gameInformation: Game;

  async joinRace(
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
      return this.playRace(client, game);
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

  async playRace(client: Client, game: DocumentType<Game>) {
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
          this.endRace(client, game);
          clearInterval(updateScoreInterval);
        }

        if (this.lastMessageUpdateTime - new Date().getTime() >= 3000) {
          // Neither user won, just update the race positions
          userOneMessage.edit(embeds.race(game.userOne, game.userTwo));
          userTwoMessage.edit(embeds.race(game.userOne, game.userTwo));
          this.lastMessageUpdateTime = new Date().getTime();
        }
      }, 1000);
    } catch (err) {
      await game.deleteOne();
      console.log(err);
    }
  }

  async endRace(client: Client, game: DocumentType<Game>) {
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
          config.gameConfiguration.coinsWinDefault - winnerData.ticksTaken * 8
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
          config.gameConfiguration.coinsLossDefault - loserData.ticksTaken * 0.9
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
              }** by \`${
                loserData.ticksTaken - winnerData.ticksTaken
              }\` seconds.`
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
}

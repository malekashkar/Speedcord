import { DocumentType } from "@typegoose/typegoose";
import { TextChannel, User } from "discord.js";
import { commafy } from ".";
import Client from "..";
import config from "../config";
import Configuration from "../config";
import { ArchivedGameModel } from "../models/archivedGame";
import { Game, GameModel } from "../models/game";
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
  client: Client;
  gameDocument: DocumentType<Game>;

  lastMessageUpdate: number = Date.now();

  constructor(document: DocumentType<Game>, client: Client) {
    this.gameDocument = document;
    this.client = client;
  }

  async joinRace(beginChannel: TextChannel) {
    try {
      const userOne = await this.client.users.fetch(
        this.gameDocument.userOne.racerId
      );
      const userTwo = await this.client.users.fetch(
        this.gameDocument.userTwo.racerId
      );

      const userOneMessage = await userOne.send(
        embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
      );
      this.gameDocument.userOne.messageId = userOneMessage.id;

      const userTwoMessage = await userTwo.send(
        embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
      );
      this.gameDocument.userTwo.messageId = userTwoMessage.id;

      await this.gameDocument.save();
      return this.playRace();
    } catch (err) {
      await this.gameDocument.deleteOne();
      console.log(err);
      beginChannel.send(
        embeds.normal(
          `Game Cancelled`,
          `The game was cancelled because one of the players had their DM's closed.`
        )
      );
    }
  }

  async playRace() {
    try {
      const userOneGearShifts = Math.round(
        ((config.gameConfiguration.totalRaceHorsepower /
          this.gameDocument.userOne.carBaseSpeed) *
          5) /
          6 /
          6
      );

      const userTwoGearShifts = Math.round(
        ((config.gameConfiguration.totalRaceHorsepower /
          this.gameDocument.userTwo.carBaseSpeed) *
          5) /
          6 /
          6
      );
      
      const userOne = await this.client.users.fetch(
        this.gameDocument.userOne.racerId
      );
      const userTwo = await this.client.users.fetch(
        this.gameDocument.userTwo.racerId
      );

      const userOneMessage = await userOne.dmChannel.messages.fetch(
        this.gameDocument.userOne.messageId
      );
      const userTwoMessage = await userTwo.dmChannel.messages.fetch(
        this.gameDocument.userTwo.messageId
      );

      let someoneWon = false;
      const updateScoreInterval = setInterval(async () => {
        if (
          this.gameDocument.userOne.horsepowerCompleted <
          Configuration.gameConfiguration.totalRaceHorsepower
        ) {
          this.gameDocument.userOne.ticksTaken += 1;
          this.gameDocument.userOne.horsepowerCompleted +=
            this.gameDocument.userOne.carBaseSpeed;
        }

        if (
          this.gameDocument.userTwo.horsepowerCompleted <
          Configuration.gameConfiguration.totalRaceHorsepower
        ) {
          this.gameDocument.userTwo.ticksTaken += 1;
          this.gameDocument.userTwo.horsepowerCompleted +=
            this.gameDocument.userTwo.carBaseSpeed;
        }

        if (
          (this.gameDocument.userOne.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower ||
            this.gameDocument.userTwo.horsepowerCompleted >=
              Configuration.gameConfiguration.totalRaceHorsepower) &&
          !someoneWon
        ) {
          // Someone won the race
          userOneMessage.edit(
            embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
          );
          userTwoMessage.edit(
            embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
          );
          someoneWon = true;
        } else if (
          this.gameDocument.userOne.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower &&
          this.gameDocument.userTwo.horsepowerCompleted >=
            Configuration.gameConfiguration.totalRaceHorsepower &&
          someoneWon
        ) {
          // Game completely ended, move to archived
          this.endRace();
          clearInterval(updateScoreInterval);
        } else if (Date.now() - this.lastMessageUpdate >= 5000) {
          // Neither user won, just update the race positions
          userOneMessage.edit(
            embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
          );
          userTwoMessage.edit(
            embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
          );
        }
      }, 1000);
    } catch (err) {
      await this.gameDocument.deleteOne();
      console.log(err);
    }
  }

  async endRace() {
    try {
      const userOne = await this.client.users.fetch(
        this.gameDocument.userOne.racerId
      );
      const userOneMessage = await userOne.dmChannel.messages.fetch(
        this.gameDocument.userOne.messageId
      );
      const userOneProfile = await RacerModel.findOne({
        userId: this.gameDocument.userOne.racerId,
      });

      const userTwo = await this.client.users.fetch(
        this.gameDocument.userTwo.racerId
      );
      const userTwoMessage = await userTwo.dmChannel.messages.fetch(
        this.gameDocument.userTwo.messageId
      );
      const userTwoProfile = await RacerModel.findOne({
        userId: this.gameDocument.userTwo.racerId,
      });

      const racerPlaces = this.gameDocument.places;
      if (!racerPlaces) {
        // User One
        if (userOneProfile) {
          userOneProfile.credits += config.gameConfiguration.creditsTieReward;
          userOneProfile.experience +=
            config.gameConfiguration.experienceTieReward;
          await userOneProfile.save();
        }

        // User Two
        if (userTwoProfile) {
          userTwoProfile.credits += config.gameConfiguration.creditsTieReward;
          userTwoProfile.experience +=
            config.gameConfiguration.experienceTieReward;
          await userTwoProfile.save();
        }
      } else {
        // Winner Information
        const winnerCredits = Math.round(
          config.gameConfiguration.creditsWinDefault -
            racerPlaces[0].ticksTaken * 8
        );
        const winnerExperience = Math.round(
          config.gameConfiguration.experienceWinDefault -
            racerPlaces[0].ticksTaken * 40
        );
        const winnerEmbed = embeds
          .race(this.gameDocument.userOne, this.gameDocument.userTwo)
          .setTitle(`Race Won`)
          .setDescription(
            `🎉 You beat **${racerPlaces[1].racerDisplayName}** by \`${
              racerPlaces[1].ticksTaken - racerPlaces[0].ticksTaken
            }\` seconds.`
          )
          .addField(
            `Rewards`,
            `**Credits** $${commafy(winnerCredits)}
      **Experience** ${commafy(winnerExperience)}`,
            true
          );

        // Loser Information
        const loserCredits = Math.round(
          config.gameConfiguration.creditsLossDefault -
            racerPlaces[1].ticksTaken * 0.9
        );
        const loserExperience = Math.round(
          config.gameConfiguration.experienceLossDefault -
            racerPlaces[1].ticksTaken * 9
        );
        const loserEmbed = embeds
          .race(this.gameDocument.userOne, this.gameDocument.userTwo)
          .setTitle(`Race Lost`)
          .setDescription(
            `Sadly, you lost the race to **${
              racerPlaces[0].racerDisplayName
            }** by \`${
              racerPlaces[1].ticksTaken - racerPlaces[0].ticksTaken
            }\` seconds.`
          )
          .addField(
            `Rewards`,
            `**Credits** $${commafy(loserCredits)}
      **Experience** ${commafy(loserExperience)}`,
            true
          );

        if (racerPlaces[0].racerId === userOne.id) {
          // User One Winner
          if (userOneProfile) {
            userOneProfile.credits += winnerCredits;
            userOneProfile.experience += winnerExperience;
            await userOneProfile.save();
          }
          userOneMessage.edit(winnerEmbed);

          // User Two Loser
          if (userTwoProfile) {
            userTwoProfile.credits += loserCredits;
            userTwoProfile.experience += loserExperience;
            await userTwoProfile.save();
          }
          userTwoMessage.edit(loserEmbed);
        } else {
          // User One Loser
          if (userOneProfile) {
            userOneProfile.credits += loserCredits;
            userOneProfile.experience += loserExperience;
            await userOneProfile.save();
          }
          userOneMessage.edit(loserEmbed);

          // User Two Winner
          if (userTwoProfile) {
            userTwoProfile.credits += loserCredits;
            userTwoProfile.experience += loserExperience;
            await userTwoProfile.save();
          }
          userTwoMessage.edit(winnerEmbed);
        }
      }

      await ArchivedGameModel.create({
        userOne: this.gameDocument.userOne,
        userTwo: this.gameDocument.userTwo,
      });
      await this.gameDocument.deleteOne();
    } catch (err) {
      await this.gameDocument.deleteOne();
      console.log(err);
    }
  }
}

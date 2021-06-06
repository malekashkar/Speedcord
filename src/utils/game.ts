import { DocumentType } from "@typegoose/typegoose";
import { stripIndents } from "common-tags";
import { TextChannel, User } from "discord.js";
import { commafy, randomElementSelector } from ".";
import Client from "..";
import config from "../config";
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
    if (config.gameConfiguration.queueExperienceDiversion) {
      availableGames = await GameModel.find({
        status: "CREATED",
        "userOne.racerId": { $ne: author.id },
        "userOne.racerExperience": {
          $gte: experience - config.gameConfiguration.queueExperienceDiversion,
          $lte: experience + config.gameConfiguration.queueExperienceDiversion,
        },
        userTwo: { $exists: false },
      });
    } else {
      availableGames = await GameModel.find({
        status: "CREATED",
        "userOne.racerId": { $ne: author.id },
        userTwo: { $exists: false },
      });
    }
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
  ended: boolean = false;
  gameDocument: DocumentType<Game>;

  gameInterval: NodeJS.Timeout;
  userOneUpdateTime: number = Date.now();
  userTwoUpdateTime: number = Date.now();

  constructor(document: DocumentType<Game>, client: Client) {
    this.gameDocument = document;
    this.client = client;
  }

  endInterval() {
    clearInterval(this.gameInterval);
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
      const userOneGearInterval =
        config.gameConfiguration.totalRaceHorsepower /
        this.gameDocument.userOne.carBaseSpeed /
        Math.round(
          ((config.gameConfiguration.totalRaceHorsepower /
            this.gameDocument.userOne.carBaseSpeed) *
            5) /
            6 /
            6
        );

      const userTwoGearInterval =
        config.gameConfiguration.totalRaceHorsepower /
        this.gameDocument.userTwo.carBaseSpeed /
        Math.round(
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
      this.gameInterval = setInterval(async () => {
        if (
          this.gameDocument.userOne.horsepowerCompleted <
          config.gameConfiguration.totalRaceHorsepower
        ) {
          this.gameDocument.userOne.ticksTaken += 1;
          this.gameDocument.userOne.horsepowerCompleted +=
            this.gameDocument.userOne.carBaseSpeed;
        }

        if (
          this.gameDocument.userTwo.horsepowerCompleted <
          config.gameConfiguration.totalRaceHorsepower
        ) {
          this.gameDocument.userTwo.ticksTaken += 1;
          this.gameDocument.userTwo.horsepowerCompleted +=
            this.gameDocument.userTwo.carBaseSpeed;
        }

        if (
          (this.gameDocument.userOne.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower ||
            this.gameDocument.userTwo.horsepowerCompleted >=
              config.gameConfiguration.totalRaceHorsepower) &&
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
            config.gameConfiguration.totalRaceHorsepower &&
          this.gameDocument.userTwo.horsepowerCompleted >=
            config.gameConfiguration.totalRaceHorsepower &&
          someoneWon
        ) {
          // Game completely ended, move to archived
          this.endRace();
        } else {
          // Neither user won, just update the race positions
          if (Date.now() - this.userOneUpdateTime >= userOneGearInterval) {
            await userOneMessage.reactions.removeAll();

            userOneMessage.edit(
              embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
            );

            const correctShiftEmoji =
              config.gearShiftsEmojis[
                Math.floor(Math.random() * config.gearShiftsEmojis.length)
              ];

            let randomReactions = randomElementSelector(
              config.gearShiftsEmojis,
              5
            );
            if (!randomReactions.includes(correctShiftEmoji))
              randomReactions = randomReactions
                .slice(0, randomReactions.length - 1)
                .concat([correctShiftEmoji]);

            for (const emoji of randomReactions) {
              userOneMessage.react(emoji);
            }
          }

          if (Date.now() - this.userTwoUpdateTime >= userTwoGearInterval) {
            userTwoMessage.edit(
              embeds.race(this.gameDocument.userOne, this.gameDocument.userTwo)
            );
          }
        }
      }, 1000);
    } catch (err) {
      await this.gameDocument.deleteOne();
      console.log(err);
    }
  }

  async endRace(forfeiterId?: string) {
    this.endInterval();

    try {
      // User One Information
      const userOne = await this.client.users.fetch(
        this.gameDocument.userOne.racerId
      );
      const userOneMessage = await userOne.dmChannel.messages.fetch(
        this.gameDocument.userOne.messageId
      );
      const userOneProfile = await RacerModel.findOne({
        userId: this.gameDocument.userOne.racerId,
      });

      // User Two Information
      const userTwo = await this.client.users.fetch(
        this.gameDocument.userTwo.racerId
      );
      const userTwoMessage = await userTwo.dmChannel.messages.fetch(
        this.gameDocument.userTwo.messageId
      );
      const userTwoProfile = await RacerModel.findOne({
        userId: this.gameDocument.userTwo.racerId,
      });

      // Complete the Race Ending Process
      const racerPlaces = this.gameDocument.places;
      if (forfeiterId) {
        const ticksTaken =
          this.gameDocument.userOne.racerId === forfeiterId
            ? config.gameConfiguration.totalRaceHorsepower /
                this.gameDocument.userTwo.horsepowerCompleted +
              this.gameDocument.userTwo.ticksTaken
            : config.gameConfiguration.totalRaceHorsepower /
                this.gameDocument.userOne.horsepowerCompleted +
              this.gameDocument.userOne.ticksTaken;
        const winnerCredits = Math.round(
          config.gameConfiguration.creditsWinDefault - ticksTaken * 8
        );
        const winnerExperience = Math.round(
          config.gameConfiguration.experienceWinDefault - ticksTaken * 40
        );

        const forfeiter =
          this.gameDocument.userOne.racerId === forfeiterId
            ? this.gameDocument.userOne
            : this.gameDocument.userTwo;
        const winner =
          this.gameDocument.userOne.racerId === forfeiterId
            ? this.gameDocument.userTwo
            : this.gameDocument.userOne;

        const winnerEmbed = embeds
          .race(this.gameDocument.userOne, this.gameDocument.userTwo)
          .setTitle(`Race Forfeited`)
          .setDescription(
            `**${forfeiter.racerDisplayName}** forfeited the race against **${winner.racerDisplayName}**!`
          )
          .addField(
            `Rewards`,
            stripIndents`**Credits** ${commafy(winnerCredits)}
              **Experience** ${commafy(winnerExperience)}`,
            true
          );

        const forfeiterEmbed = embeds
          .race(this.gameDocument.userOne, this.gameDocument.userTwo)
          .setTitle(`Race Forfeited`)
          .setDescription(
            `**${forfeiter.racerDisplayName}** forfeited the race against **${winner.racerDisplayName}**!`
          );

        if (this.gameDocument.userOne.racerId === forfeiterId) {
          if (userTwoProfile) {
            userTwoProfile.credits += winnerCredits;
            userTwoProfile.experience += winnerExperience;
            await userTwoProfile.save();
          }
          userOneMessage.edit(forfeiterEmbed);
          userTwoMessage.edit(winnerEmbed);
        } else {
          if (userOneProfile) {
            userOneProfile.credits += winnerCredits;
            userOneProfile.experience += winnerExperience;
            await userOneProfile.save();
          }
          userOneMessage.edit(winnerEmbed);
          userTwoMessage.edit(forfeiterEmbed);
        }
        // Give the reward to the winner
      } else {
        if (!racerPlaces) {
          const tieEmbed = embeds
            .race(this.gameDocument.userOne, this.gameDocument.userTwo)
            .setTitle(`Race Tied`)
            .setDescription(
              `The race ended in a tie between you and your opponent!`
            )
            .addField(
              `Rewards`,
              stripIndents`**Credits** ${commafy(
                config.gameConfiguration.creditsTieReward
              )}
              **Experience** ${commafy(
                config.gameConfiguration.experienceTieReward
              )}`,
              true
            );

          // User One
          userOneMessage.edit(tieEmbed);
          if (userOneProfile) {
            userOneProfile.credits += config.gameConfiguration.creditsTieReward;
            userOneProfile.experience +=
              config.gameConfiguration.experienceTieReward;
            await userOneProfile.save();
          }

          // User Two
          userTwoMessage.edit(tieEmbed);
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
              `**Credits** ${commafy(winnerCredits)}
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
              `**Credits** ${commafy(loserCredits)}
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
      }

      await ArchivedGameModel.create({
        userOne: this.gameDocument.userOne,
        userTwo: this.gameDocument.userTwo,
      });
      await this.gameDocument.deleteOne();
      this.ended = true;
    } catch (err) {
      await this.gameDocument.deleteOne();
      console.log(err);
    }
  }
}

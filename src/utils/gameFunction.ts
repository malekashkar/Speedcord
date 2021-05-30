import { DocumentType } from "@typegoose/typegoose";
import { User } from "discord.js";
import Client from "..";
import Configuration from "../config";
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

export async function playGame(client: Client, game: DocumentType<Game>) {
  try {
    setInterval(async () => {
      if (
        game.userOne.horsepowerCompleted <
        Configuration.gameConfiguration.totalRaceHorsepower
      ) {
        game.userOne.horsepowerCompleted = game.userOne.carBaseSpeed * 5;
        game.userOne.ticksTaken = 5;

        const userOne = await client.users.fetch(game.userOne.racerId);
        if (userOne) {
          userOne.send(embeds.race(game.userOne, game.userTwo));
        }
      } else {
        // The first user won
      }

      if (
        game.userOne.horsepowerCompleted <
        Configuration.gameConfiguration.totalRaceHorsepower
      ) {
        game.userTwo.horsepowerCompleted = game.userTwo.carBaseSpeed * 5;
        game.userTwo.ticksTaken = 5;

        const userTwo = await client.users.fetch(game.userOne.racerId);
        if (userTwo) {
          userTwo.send(embeds.race(game.userOne, game.userTwo));
        }
      } else {
        // The second user won
      }
    }, 5000);
  } catch (err) {
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

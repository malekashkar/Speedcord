import { MessageEmbed } from "discord.js";
import config from "../config";
import ms from "ms";
import { stripIndents } from "common-tags";
import { RacerState } from "../models/game";
import Configuration from "../config";

export default class embeds {
  static error = function (error: string, title = "Error Caught") {
    return embeds.empty().setTitle(title).setDescription(error).setColor("RED");
  };

  static forceError = function () {
    return embeds
      .empty()
      .setTitle(`Error Detected`)
      .setDescription(`An error has occured, please try again later.`)
      .setColor("RED");
  };

  static normal = function (title: string, description: string) {
    return embeds.empty().setTitle(title).setDescription(description);
  };

  static question = function (
    question: string,
    option?: "TITLE" | "DESCRIPTION"
  ) {
    if (option === "DESCRIPTION") {
      return embeds
        .empty()
        .setDescription(question)
        .setFooter(
          `You have ${ms(config.questionTime)} to reply to the question above.`
        );
    } else {
      return embeds
        .empty()
        .setTitle(question)
        .setFooter(
          `You have ${ms(config.questionTime)} to reply to the question above.`
        );
    }
  };

  static empty = function () {
    return new MessageEmbed().setColor(config.color);
  };

  static start = function () {
    return embeds.error(
      `Please run the \`${config.prefix}race\` command before other game commands!`,
      `Begin Playing`
    );
  };

  static race = function (userOneState: RacerState, userTwoState: RacerState) {
    const userOneLeftDashLines =
      Math.round(
        (userOneState.horsepowerCompleted /
          Configuration.gameConfiguration.totalRaceHorsepower) *
          10
      ) * 2;

    const userTwoLeftDashLines =
      Math.round(
        (userTwoState.horsepowerCompleted /
          Configuration.gameConfiguration.totalRaceHorsepower) *
          10
      ) * 2;

    const gameEmbed = new MessageEmbed()
      .setColor(config.color)
      .addField(
        `${userOneState.racerDisplayName}`,
        stripIndents`**${userOneState.carName}**` +
          `\n\`__________________________\`` +
          `\n:checkered_flag:` +
          `${
            20 - userOneLeftDashLines
              ? `\`${`=`.repeat(20 - userOneLeftDashLines)}\``
              : ``
          }` +
          `:red_car:` +
          `${
            userOneLeftDashLines
              ? `\`${`=`.repeat(userOneLeftDashLines)}\``
              : ``
          }` +
          ` \n\`__________________________\``,
        true
      )
      .addField(
        `${userTwoState.racerDisplayName}`,
        stripIndents`**${userTwoState.carName}**` +
          `\n\`__________________________\`` +
          `\n:checkered_flag:` +
          `${
            20 - userTwoLeftDashLines
              ? `\`${`=`.repeat(20 - userTwoLeftDashLines)}\``
              : ``
          }` +
          `:blue_car:` +
          `${
            userTwoLeftDashLines
              ? `\`${`=`.repeat(userTwoLeftDashLines)}\``
              : ``
          }` +
          ` \n\`__________________________\``,
        true
      );

    if (
      userOneState.horsepowerCompleted >=
        Configuration.gameConfiguration.totalRaceHorsepower &&
      userTwoState.horsepowerCompleted >=
        Configuration.gameConfiguration.totalRaceHorsepower
    ) {
      if (userOneState.ticksTaken < userTwoState.ticksTaken) {
        return gameEmbed.setDescription(
          `:tada: The race ended with a win in **${userOneState.racerDisplayName}'s** favor.`
        );
      } else if (userOneState.ticksTaken > userTwoState.ticksTaken) {
        return gameEmbed.setDescription(
          `:tada: The race ended with a win in **${userTwoState.racerDisplayName}'s** favor.`
        );
      } else {
        return gameEmbed.setDescription(
          `:tada: The race ended in a tie between **${userOneState.racerDisplayName}** and **${userTwoState.racerDisplayName}**.`
        );
      }
    } else if (
      userOneState.horsepowerCompleted >=
      Configuration.gameConfiguration.totalRaceHorsepower
    ) {
      return gameEmbed.setDescription(
        `:tada: The race ended with a win in **${userOneState.racerDisplayName}'s** favor.`
      );
    } else if (
      userTwoState.horsepowerCompleted >=
      Configuration.gameConfiguration.totalRaceHorsepower
    ) {
      return gameEmbed.setDescription(
        `:tada: The race ended with a win in **${userTwoState.racerDisplayName}'s** favor.`
      );
    } else {
      return gameEmbed;
    }
  };
}

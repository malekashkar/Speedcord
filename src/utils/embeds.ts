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

  static race = function (userOneState: RacerState, userTwoState: RacerState) {
    const userOneLeftDashLines = Math.round(
      (userOneState.horsepowerCompleted /
        Configuration.gameConfiguration.totalRaceHorsepower) *
        10
    );

    const userTwoLeftDashLines = Math.round(
      (userTwoState.horsepowerCompleted /
        Configuration.gameConfiguration.totalRaceHorsepower) *
        10
    );

    const userOneRightDashLines = 10 - userOneLeftDashLines;
    const userTwoRightDashLines = 10 - userTwoLeftDashLines;

    return new MessageEmbed()
      .setColor(config.color)
      .addField(
        `${userOneState.racerDisplayName} ~ **${userOneState.carName}**`,
        stripIndents`\`_____________________\`
      :checkered_flag:${
        userOneRightDashLines ? `\`${`=`.repeat(userOneRightDashLines)}\`` : ``
      }:red_car:${
          userOneLeftDashLines ? `\`${`=`.repeat(userOneLeftDashLines)}\`` : ``
        }
      \`_____________________\``,
        true
      )
      .addField(
        `${userTwoState.racerDisplayName} ~ **${userTwoState.carName}**`,
        stripIndents`\`_____________________\`
      :checkered_flag:${
        userTwoRightDashLines ? `\`${`=`.repeat(userTwoRightDashLines)}\`` : ``
      }:blue_car:${
          userTwoLeftDashLines ? `\`${`=`.repeat(userTwoLeftDashLines)}\`` : ``
        }
      \`_____________________\``,
        true
      );
  };
}

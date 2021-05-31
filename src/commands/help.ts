import { Message } from "discord.js";
import Command from ".";
import Configuration from "../config";
import embeds from "../utils/embeds";

export default class HelpCommand extends Command {
  cmdName = "help";
  description = "Need help? Use this command for a list of commands.";

  async run(message: Message) {
    const formattedCommands = this.client.commands
      .array()
      .map((command, i) => {
        const commandName = `\`${Configuration.prefix}${command.cmdName
          .toString()
          .padEnd(8)}\``;
        if (i % 2 == 0) {
          return `${commandName} ${command.description}`;
        } else {
          return `${commandName} **${command.description}**`;
        }
      })
      .join("\n");
    const helpEmbed = embeds
      .normal(`📚 Help Menu`, formattedCommands)
      .setFooter(
        `Run the ${Configuration.prefix}info command for further help!`
      );
    return message.channel.send(helpEmbed);
  }
}

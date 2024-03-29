import logger from "../utils/logger";
import { Message, TextChannel } from "discord.js";
import Event, { EventNameType } from ".";
import config from "../config";
import { config as dotenv } from "dotenv";

dotenv();

export default class CommandHandler extends Event {
  eventName: EventNameType = "message";

  async handle(message: Message) {
    if (message.author?.bot) return;

    try {
      const prefix =
        process.env.NODE_ENV === "production"
          ? config.prefix.toLowerCase()
          : config.testingPrefix.toLowerCase();
      if (!prefix || message.content.toLowerCase().indexOf(prefix) !== 0)
        return;

      const args = message.content
        .slice(prefix.length)
        .trim()
        .replace(/ /g, "\n")
        .split(/\n+/g);
      const command = args.shift().toLowerCase();

      for (const commandObj of this.client.commands.array()) {
        if (commandObj.disabled) return;
        if (
          commandObj.cmdName.toLowerCase() === command ||
          commandObj.aliases.map((x) => x.toLowerCase()).includes(command)
        ) {
          commandObj
            .run(message, args)
            .catch((err) =>
              logger.error(`${command.toUpperCase()}_ERROR`, err)
            );
        }
      }
    } catch (err) {
      logger.error("COMMAND_HANDLER", err);
    }
  }
}

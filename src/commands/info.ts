import { Message } from "discord.js";
import Command from ".";

export default class InfoCommand extends Command {
  cmdName = "info";
  description = "Some valuable information you might need to play Speedcord";

  async run(message: Message) {
    return message.channel.send(`Info`);
  }
}

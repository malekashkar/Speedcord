import { Message } from "discord.js";
import Command from ".";
export default class TestCommand extends Command {
  cmdName = "test";
  description = "Test";

  async run(message: Message) {
    message.channel.send(`testing the auto update`);
  }
}

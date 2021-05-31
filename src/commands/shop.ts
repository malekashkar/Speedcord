import { Message } from "discord.js";
import Command from ".";

export default class ShopCommand extends Command {
  cmdName = "shop";
  description = "Buy whatever your heart desires.";

  async run(message: Message) {}
}

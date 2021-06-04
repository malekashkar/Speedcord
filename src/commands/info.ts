import { Message } from "discord.js";
import Command from ".";
import embeds from "../utils/embeds";

export default class InfoCommand extends Command {
  cmdName = "info";
  description = "Some valuable information you might need to play Speedcord";
  aliases = ["tutorial"];

  async run(message: Message) {
    const infoEmbed = embeds.normal(
      `Speecord Tutorial`,
      `Welcome to Speedcord! In this fun game, there are many commands that you may need to know, or maybe some that you don't! All it takes is a little getting used to and you are set for the rest of your racing career. This message shows you the basics about playing. So, first things first, you have to get your profile set up. In order to do that, run the command "/race" or "/play" and if you do not have an account set up, you will be prompt to do so. It will give a step-by-step tutorial on creating your Speedcord account. Once you create your account and choose your very first car, you can now use the "/race" command in order to start your first race. You will use this command throughout your adventure whenever you want to race for a chance at big earnings. As you race more, you will earn more experience and coins. You can use these coins to purchase cars and other items that we have in the shop. (You can access the shop using the "/shop" command) Experience is used to show where you rank in playing. Experience is gained by winning races and you race other players that have a similar experience as you. As you buy/unlock more cars, you will find that there has to be a place to store them. This is known as your garage and you can access it with the "/garage" command. You can see the cars that you own and you can see their descriptions and statistics. When you go for a race, there are a few things you will need to know. A race consists of a 1v1 for first place. Throughout the race, based on your car's horsepower, gear shifts appear. There are reactions that appear at the bottom of the race, and whatever color appears on your screen, you click the corresponding color in the reactions. If you get it within the allotted time limit, you get a boost that accelerates your car for a short period of time and gives you a better chance at winning. If you would like to see an entire list of the current commands, run the command "/commands" to see it. Keep on racing and try to get to number one and become the Ultimate Racer!`
    );
    return message.channel.send(infoEmbed);
  }
}

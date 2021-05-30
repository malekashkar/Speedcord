import { prop } from "@typegoose/typegoose";
import { RacerState } from "./game";

export class Game {
  @prop({ type: RacerState })
  userOne: RacerState;

  @prop({ type: RacerState })
  userTwo: RacerState;

  get places() {
    if (this.userOne.ticksTaken < this.userTwo.ticksTaken) {
      return [this.userOne, this.userTwo];
    } else {
      return [this.userTwo, this.userOne];
    }
  }
}

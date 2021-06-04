import { getModelForClass, prop } from "@typegoose/typegoose";
import { RacerState } from "./game";

export class ArchivedGame {
  @prop({ type: RacerState })
  userOne: RacerState;

  @prop({ type: RacerState })
  userTwo: RacerState;

  get places() {
    if (this.userOne.ticksTaken === this.userTwo.ticksTaken) {
      return null;
    } else if (this.userOne.ticksTaken < this.userTwo.ticksTaken) {
      return [this.userOne, this.userTwo];
    } else if (this.userOne.ticksTaken > this.userTwo.ticksTaken) {
      return [this.userTwo, this.userOne];
    }
  }
}

export const ArchivedGameModel = getModelForClass(ArchivedGame);

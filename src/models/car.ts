import { getModelForClass, prop } from "@typegoose/typegoose";

export class Car {
  @prop()
  racerId: string;

  @prop()
  carId: number;

  @prop({ default: true })
  tradable?: boolean;
}

export const CarModel = getModelForClass(Car);

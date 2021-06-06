import { Car } from "../cars";

export function carTable(cars: Car[]) {
  let string = `**Car** - **Price** - **Horsepower**`;

  for (const car of cars) {
    string += `\n*${car.carName}* - $${commafy(car.price)} - ${commafy(
      car.baseSpeed
    )} HP`;
  }

  return string;
}

export function commafy(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomElementSelector(array: any[], amount: number = 1) {
  if (array.length < amount) return null;
  let tempArr: any[] = [];
  while (tempArr.length < amount) {
    const randomEl = array[Math.floor(Math.random() * array.length)];
    if (!tempArr.includes(randomEl)) tempArr.push(randomEl);
  }
  return tempArr;
}

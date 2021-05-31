export interface Car {
  carId: number;
  logoUrl: string;
  carName: string;
  baseSpeed: number;
  price: number;
}

// Car names can't be longer than 27 characters

const cars: Car[] = [
  {
    carId: 0,
    logoUrl:
      "https://www.freepnglogos.com/uploads/ferrari-png/red-ferrari-gtb-car-png-image-pngpix-14.png",
    carName: "Ferrari GTB",
    baseSpeed: 612,
    price: 262647,
  },
  {
    carId: 1,
    logoUrl:
      "https://st.motortrend.com/uploads/sites/10/2017/04/2017-mercedes-benz-amg-gt-coupe-angular-front.png",
    carName: "Mercedes-AMG GT Coupé",
    baseSpeed: 201,
    price: 139150,
  },
  {
    carId: 2,
    logoUrl:
      "https://images.dealer.com/ddc/vehicles/2021/Honda/Accord/Sedan/trim_LX_15T_12b63e/perspective/front-left/2021_76.png",
    carName: "Honda Accord",
    baseSpeed: 192,
    price: 24970,
  },
  {
    carId: 3,
    logoUrl:
      "https://st.motortrend.com/uploads/sites/10/2017/08/2018-toyota-camry-le-sedan-angular-front.png",
    carName: "Toyota Camry",
    baseSpeed: 202,
    price: 25045,
  },
  {
    carId: 4,
    logoUrl:
      "https://www.motortrend.com/uploads/sites/10/2015/11/2011-chevrolet-express-passenger-van-3500-ls-ext-angular-front.png",
    carName: "Chevrolet Express Passenger",
    baseSpeed: 276,
    price: 36400,
  },
];

export default cars;

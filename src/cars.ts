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
  {
    carName: "Pontiac Catalina",
    logoUrl:
      "http://johnnylightning.com/wp-content/uploads/2016/01/JLCG001_ClassicGold_65Catalina_SetB.png",
    price: 18375,
    baseSpeed: 225,
    carId: 5,
  },
  {
    carName: "Jaguar F-Type R",
    logoUrl:
      "https://w7.pngwing.com/pngs/607/737/png-transparent-jaguar-cars-jaguar-cars-2018-jaguar-f-type-2016-jaguar-f-type-jaguar.png",
    price: 103200,
    baseSpeed: 550,
    carId: 6,
  },
  {
    carName: "BMW 2002",
    logoUrl:
      "https://static.wikia.nocookie.net/forzamotorsport/images/1/1e/HOR_XB1_BMW_2002.png/revision/latest?cb=20191111201606",
    price: 32851,
    baseSpeed: 113,
    carId: 7,
  },
  {
    carName: "Ford F250",
    logoUrl:
      "https://cdn.imgbin.com/6/16/23/imgbin-ford-super-duty-2017-ford-f-250-ford-f-650-pickup-truck-smooth-bench-WZcZ7tPQsjvS0V4inw1wqUpLQ.jpg",
    price: 34230,
    baseSpeed: 215,
    carId: 8,
  },
  {
    carName: "AMC Gremlin",
    logoUrl:
      "https://static.wikia.nocookie.net/forzamotorsport/images/2/2f/HOR_XB1_AMC_Gremlin.png/revision/latest?cb=20190915223049",
    price: 14827,
    baseSpeed: 100,
    carId: 9,
  },
  {
    carName: "Chevrolet Impala",
    logoUrl:
      "https://purepng.com/public/uploads/large/purepng.com-chevrolet-impalacarschevroletchevyautomobilechevrolet-impala-1701527430556b01ui.png",
    price: 31620,
    baseSpeed: 165,
    carId: 10,
  },
  {
    carName: "Ford Galaxie 500",
    logoUrl: "https://ecklers.com.imgeng.in/media/wysiwyg/clp/fairlane.png",
    price: 39995,
    baseSpeed: 153,
    carId: 11,
  },
  {
    carName: "Pontiac Firebird",
    logoUrl:
      "https://static.wikia.nocookie.net/forzamotorsport/images/7/77/HOR_XB1_Pontiac_Firebird_73.png/revision/latest?cb=20191014204839",
    price: 23460,
    baseSpeed: 100,
    carId: 12,
  },
  {
    carName: "Ford Mustang",
    logoUrl:
      "https://www.kindpng.com/picc/m/142-1421870_ford-mustang-png-image-transparent-png.png",
    price: 27155,
    baseSpeed: 88,
    carId: 13,
  },
  {
    carName: "Chevrolet Camaro",
    logoUrl:
      "https://www.vhv.rs/dpng/d/462-4621107_chevrolet-camaro-png-free-download-2020-chevrolet-camaro.png",
    price: 25000,
    baseSpeed: 90,
    carId: 14,
  },
  {
    carName: "Lamborghini Huracán EVO",
    logoUrl:
      "https://www.pikpng.com/pngl/b/500-5007975_www-lamborghini-com-lamborghini-huracan-evo-spyder-clipart.png",
    price: 208571,
    baseSpeed: 610,
    carId: 15,
  },
  {
    carName: "Bugatti Chiron Sport",
    logoUrl: "https://www.ccarprice.com/products/Bugatti-Chiron-Sport-2019.png",
    price: 3757150,
    baseSpeed: 1479,
    carId: 16,
  },
  {
    carName: "Porsche 911 Turbo Sport",
    logoUrl: "203500",
    price: 174300,
    baseSpeed: 640,
    carId: 17,
  },
  {
    carName: "Subaru BRZ",
    logoUrl:
      "https://web-assets.cdn.dealersolutions.com.au/modular.multisite.dealer.solutions/wp-content/uploads/sites/1659/2019/08/02003918/Subaru-BRZ.png",
    price: 28845,
    baseSpeed: 200,
    carId: 18,
  },
  {
    carName: "Ford Mustang EcoBoost Fastback",
    logoUrl:
      "https://www.pikpng.com/pngl/m/86-867613_ford-mustang-png-free-download-2019-ford-mustang.png",
    price: 27865,
    baseSpeed: 310,
    carId: 19,
  },
  {
    carName: "Volkswagen Rabbit",
    logoUrl:
      "https://static.wikia.nocookie.net/forzamotorsport/images/1/13/MOT_XB1_VW_Rabbit.png/revision/latest?cb=20191201230110",
    price: 4103,
    baseSpeed: 170,
    carId: 20,
  },
  {
    carName: "Mercedes-Benz 280s",
    logoUrl:
      "https://cdn.pixabay.com/photo/2018/05/04/19/36/mercedes-benz-280s-3374758_960_720.png",
    price: 12600,
    baseSpeed: 120,
    carId: 21,
  },
  {
    carName: "Pontiac Grand Prix",
    logoUrl:
      "https://www.cstatic-images.com/car-pictures/xl/CAB10POC051B0101.png",
    price: 5460,
    baseSpeed: 200,
    carId: 22,
  },
  {
    carName: "Acura ILX",
    logoUrl:
      "https://png.pngitem.com/pimgs/s/8-87247_2018-acura-ilx-toyota-yaris-2017-blue-hd.png",
    price: 26100,
    baseSpeed: 201,
    carId: 23,
  },
  {
    carName: "Oldsmobile Vista Cruiser",
    logoUrl:
      "https://static.wixstatic.com/media/f88402_e14801679f554e709a5c64d4723cc909~mv2.png/v1/fill/w_500,h_333,al_c,q_90,usm_0.66_1.00_0.01/f88402_e14801679f554e709a5c64d4723cc909~mv2.webp",
    price: 18818,
    baseSpeed: 180,
    carId: 24,
  },
  {
    carName: "Mitsubishi i-Miev",
    logoUrl:
      "https://cdn.imgbin.com/0/3/10/imgbin-2017-mitsubishi-i-miev-2012-mitsubishi-i-miev-2016-mitsubishi-i-miev-mitsubishi-imiev-NYPeg8Ae6vC5Kh1WADiWc6KJ0.jpg",
    price: 22995,
    baseSpeed: 66,
    carId: 25,
  },
  {
    carName: "Chevrolet Astro",
    logoUrl:
      "https://www.cstatic-images.com/car-pictures/maxWidth503/usb10chv183a0101.png",
    price: 12655,
    baseSpeed: 190,
    carId: 26,
  },
  {
    carName: "Mercedes-Benz AMG",
    logoUrl:
      "https://www.pngkey.com/png/full/141-1417751_2018-mercedes-benz-amg-gt-mercedes-benz-gts.png",
    price: 162150,
    baseSpeed: 469,
    carId: 27,
  },
  {
    carName: "Honda Civic Type R",
    logoUrl:
      "https://www.pngitem.com/pimgs/m/286-2869239_civic-type-r-png-honda-civic-2017-mugen.png",
    price: 21250,
    baseSpeed: 306,
    carId: 28,
  },
  {
    carName: "Karma Revero GT",
    logoUrl:
      "https://www.karmaautomotive.cn/wp-content/themes/karma-newsroom/karma-automotive/assets/img/revero/k2-car-2.png",
    price: 144800,
    baseSpeed: 536,
    carId: 29,
  },
  {
    carName: "Lexus ES",
    logoUrl:
      "https://www.kindpng.com/picc/m/196-1965132_2019-lexus-es-300h-ultra-luxury-lexus-es.png",
    price: 40000,
    baseSpeed: 203,
    carId: 30,
  },
];

export default cars;

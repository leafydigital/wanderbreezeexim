// import { Product } from '../types';

// import garlic from '../../dist/assets/img/garlic_powder.png';
// import ginger from '../../dist/assets/img/ginger_powder.jpg';
// import turmeric from '../../dist/assets/img/turmeric_powder.png';
// import pepper from '../../dist/assets/img/pepper_powder.png';
// import prawns from '../../dist/assets/img/prawns_dried.png';
// import anchovy from '../../dist/assets/img/anchovy_dried.png';
// import tableware from '../../dist/assets/img/ceramic_tableware.png';
// import sculptures from '../../dist/assets/img/ceramic_sculptures.png';
// import cookware from '../../dist/assets/img/ceramic_pottery.png';

// export const products: Product[] = [
//   // Spices
//   {
//     id: 'garlic-powder',
//     name: 'Garlic Powder',
//     category: 'spices',
//     image: garlic,
//     hsnCode: '0712.90.40',
//     placeOfOrigin: 'India',
//     color: 'Off White to Light Yellow',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Premium quality dehydrated garlic powder with rich aroma and flavor'
//   },
//   {
//     id: 'ginger-powder',
//     name: 'Ginger Powder',
//     category: 'spices',
//     image: ginger,
//     hsnCode: '0910.11.10',
//     placeOfOrigin: 'India',
//     color: 'Light Brown to Yellowish',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Pure dried ginger powder with authentic taste and medicinal properties'
//   },
//   {
//     id: 'turmeric-powder',
//     name: 'Turmeric Powder',
//     category: 'spices',
//     image: turmeric,
//     hsnCode: '0910.30.30',
//     placeOfOrigin: 'India',
//     color: 'Golden Yellow',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'High curcumin content turmeric powder with vibrant color and aroma'
//   },
//   {
//     id: 'pepper-powder',
//     name: 'Pepper Powder',
//     category: 'spices',
//     image: pepper,
//     hsnCode: '0904.11.20',
//     placeOfOrigin: 'India',
//     color: 'Light Brown',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Finely ground pepper powder with fresh aroma and authentic flavor'
//   },
//   // Dry Fish
//   // {
//   //   id: 'bombay-duck',
//   //   name: 'Bombay Duck (Dried)',
//   //   category: 'dry-fish',
//   //   image: 'https://images.pexels.com/photos/128408/pexels-photo-128408.jpeg',
//   //   hsnCode: '0305 59 90',
//   //   placeOfOrigin: 'India',
//   //   color: 'Golden Brown',
//   //   grade: 'Export Quality',
//   //   transport: ['Air', 'Sea'],
//   //   deliveryTime: {
//   //     air: '~ 7-10 Days',
//   //     sea: '~ 15-30 Days'
//   //   },
//   //   paymentTerms: '50% Adv | 50% OBL',
//   //   description: 'Premium quality sun-dried Bombay duck with authentic taste'
//   // },
//   {
//     id: 'prawns-dried',
//     name: 'Dried Prawns',
//     category: 'dry-fish',
//     image: prawns,
//     hsnCode: '0306.19.00',
//     placeOfOrigin: 'India',
//     color: 'Pinkish Orange',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'High-quality dried prawns processed under hygienic conditions'
//   },
//   {
//     id: 'anchovy-dried',
//     name: 'Dried Anchovy',
//     category: 'dry-fish',
//     image: anchovy,
//     hsnCode: '0305.59.00',
//     placeOfOrigin: 'India',
//     color: 'Silver Gray',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Premium dried anchovies with natural flavor and high protein content'
//   },
//   // Handcrafted Items
//   {
//     id: 'tableware-earthenware',
//     name: 'Tableware & Kitchenware',
//     category: 'Earthenware',
//     image: tableware,
//     hsnCode: '6911.10 & 6912.00',
//     placeOfOrigin: 'India',
//     color: 'Multicolored',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Traditional Indian ceramic Plates, bowls, mugs, cups, saucers, Serving dishes, teapots, and jugs'
//   },
//   {
//     id: 'decorative-earthenware',
//     name: 'Decorative Ceramic Items',
//     category: 'Earthenware',
//     image: sculptures,
//     hsnCode: '6913.10 / 6913.90',
//     placeOfOrigin: 'India',
//     color: 'Multicolored',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Indian made ceramic Vases, sculptures, candle holders, Garden planters'
//   },
//   {
//     id: 'cookware-earthenware',
//     name: 'Ceramic Cookware',
//     category: 'Earthenware',
//     image: cookware,
//     hsnCode: '6912.00',
//     placeOfOrigin: 'India',
//     color: 'Multicolored',
//     grade: 'Export Quality',
//     transport: ['Air', 'Sea'],
//     deliveryTime: {
//       air: '~ 7-10 Days',
//       sea: '~ 15-30 Days'
//     },
//     paymentTerms: '50% Adv | 50% OBL',
//     description: 'Exquisite ceramic Clay pots, baking dishes, tagines, casseroles'
//   }
// ];

import { Product } from '../types';

// Images (reuse existing where possible)
import cardamom from '../../dist/assets/img/Cardamom.png';
import blackPepper from '../../dist/assets/img/Pepper.png';
// import cloves from '../../dist/assets/img/pepper_powder.png';
// import garlicRaw from '../../dist/assets/img/pepper_powder.png';
// import garlicPowder from '../../dist/assets/img/pepper_powder.png';
// import gingerRaw from '../../dist/assets/img/pepper_powder.png';
// import gingerPowder from '../../dist/assets/img/pepper_powder.png';
// import dryChili from '../../dist/assets/img/pepper_powder.png';
import onion from '../../dist/assets/img/Onion.png';
import coconut from '../../dist/assets/img/Coconut.png';
import banana from '../../dist/assets/img/Banana.png';

export const products: Product[] = [

  // CARDAMOM
  {
    id: 'cardamom-raw',
    name: 'Green Cardamom (Raw)',
    category: 'spices',
    image: cardamom,
    hsnCode: '0908.31.00',
    placeOfOrigin: 'India',
    color: 'Natural Green',
    grade: 'Bold 8mm+ / 7mm / 6mm',
    description: 'Premium Indian green cardamom sorted by size grades suitable for export'
  },
  // BLACK PEPPER
  {
    id: 'black-pepper-raw',
    name: 'Black Pepper (Whole)',
    category: 'spices',
    image: blackPepper,
    hsnCode: '0904.11.20',
    placeOfOrigin: 'India',
    color: 'Black',
    grade: 'FAQ / 500 G/L / 550 G/L',
    description: 'High density whole black pepper suitable for international export'
  },
 
  // // CLOVES
  // {
  //   id: 'cloves-raw',
  //   name: 'Cloves (Whole)',
  //   category: 'spices',
  //   image: cloves,
  //   hsnCode: '0907.00.00',
  //   placeOfOrigin: 'India',
  //   color: 'Dark Brown',
  //   grade: 'Hand Picked / FAQ',
  //   description: 'Premium whole cloves with high oil content for export'
  // },
  // {
  //   id: 'cloves-powder',
  //   name: 'Clove Powder',
  //   category: 'spices',
  //   image: cloves,
  //   hsnCode: '0907.00.00',
  //   placeOfOrigin: 'India',
  //   color: 'Brown',
  //   grade: 'Fine Ground',
  //   description: 'Finely ground clove powder with strong aroma'
  // },

  // // GARLIC
  // {
  //   id: 'garlic-raw',
  //   name: 'Garlic (Raw Bulbs)',
  //   category: 'agri-products',
  //   image: garlicRaw,
  //   hsnCode: '0703.20.00',
  //   placeOfOrigin: 'India',
  //   color: 'White',
  //   grade: 'Size: 40mm / 45mm / 50mm',
  //   description: 'Fresh raw garlic bulbs sorted by export size grades'
  // },
  // {
  //   id: 'garlic-powder',
  //   name: 'Garlic Powder',
  //   category: 'spices',
  //   image: garlicPowder,
  //   hsnCode: '0712.90.40',
  //   placeOfOrigin: 'India',
  //   color: 'Off White',
  //   grade: 'Fine Ground – 80 Mesh',
  //   description: 'Dehydrated garlic powder processed under hygienic conditions'
  // },

  // // GINGER
  // {
  //   id: 'ginger-raw',
  //   name: 'Ginger (Raw)',
  //   category: 'agri-products',
  //   image: gingerRaw,
  //   hsnCode: '0910.11.10',
  //   placeOfOrigin: 'India',
  //   color: 'Natural Brown',
  //   grade: 'Size: 150g / 200g / 250g',
  //   description: 'Fresh raw ginger roots sorted for export markets'
  // },
  // {
  //   id: 'ginger-powder',
  //   name: 'Ginger Powder',
  //   category: 'spices',
  //   image: gingerPowder,
  //   hsnCode: '0910.12.00',
  //   placeOfOrigin: 'India',
  //   color: 'Light Brown',
  //   grade: 'Fine Ground – 60 Mesh',
  //   description: 'Pure dried ginger powder with strong flavor'
  // },

  // // DRY CHILI
  // {
  //   id: 'dry-chili-raw',
  //   name: 'Dry Red Chili (Whole)',
  //   category: 'spices',
  //   image: dryChili,
  //   hsnCode: '0904.22.10',
  //   placeOfOrigin: 'India',
  //   color: 'Red',
  //   grade: 'S17 / Teja / Byadgi',
  //   description: 'Indian dry red chilies sorted by popular export grades'
  // },
  // {
  //   id: 'dry-chili-powder',
  //   name: 'Red Chili Powder',
  //   category: 'spices',
  //   image: dryChili,
  //   hsnCode: '0904.22.20',
  //   placeOfOrigin: 'India',
  //   color: 'Bright Red',
  //   grade: 'Fine Ground – 60 Mesh',
  //   description: 'High color value red chili powder for export'
  // },

  // ONION
  {
    id: 'onion',
    name: 'Fresh Onion',
    category: 'agri-products',
    image: onion,
    hsnCode: '0703.10.00',
    placeOfOrigin: 'India',
    color: 'Red / White',
    grade: 'Size: 40mm / 50mm / 60mm',
    description: 'Fresh export quality onions sorted by size'
  },

  // COCONUT
  {
    id: 'coconut',
    name: 'Fresh Coconut',
    category: 'agri-products',
    image: coconut,
    hsnCode: '0801.19.10',
    placeOfOrigin: 'India',
    color: 'Natural Brown',
    grade: 'Weight: 400 – 600g per coconut',
    description: 'Mature fresh coconuts suitable for international export'
  },
  // COCONUT
  {
    id: 'banana',
    name: 'Banana - G9',
    category: 'agri-products',
    image: banana,
    hsnCode: '0803.90',
    placeOfOrigin: 'India',
    color: 'Natural Green',
    grade: '5 finger - 20 cm length minimum',
    description: 'Fresh harvested bananas with export quality'
  }

];

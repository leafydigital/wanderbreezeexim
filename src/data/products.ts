
import { Product } from '../types';

// Images (reuse existing where possible)
import cardamom from '../../dist/assets/Cardamom.png';
import blackPepper from '../../dist/assets/Pepper.png';
// import cloves from '../../dist/assets/img/pepper_powder.png';
// import garlicRaw from '../../dist/assets/img/pepper_powder.png';
// import garlicPowder from '../../dist/assets/img/pepper_powder.png';
// import gingerRaw from '../../dist/assets/img/pepper_powder.png';
// import gingerPowder from '../../dist/assets/img/pepper_powder.png';
// import dryChili from '../../dist/assets/img/pepper_powder.png';
import onion from '../../dist/assets/Onion.png';
import coconut from '../../dist/assets/Coconut.png';
import banana from '../../dist/assets/Banana.png';
import cocopeat from '../../dist/assets/coco-peats.png';
import sweetpotato from '../../dist/assets/Sweetpotato.png';
import yellowpumpkin from '../../dist/assets/Pumpkin.png';

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
    description: 'Premium Indian green cardamom sorted by size grades suitable for export',
    route:"/products/cardamom"
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
    description: 'High density whole black pepper suitable for international export',
    route:"/products/pepper"
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
    description: 'Fresh export quality onions sorted by size',
    route:"/products/onion"
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
    description: 'Mature fresh coconuts suitable for international export',
    route:"/products/coconuts"
  },
  // BANANA
  {
    id: 'banana',
    name: 'Banana - G9',
    category: 'agri-products',
    image: banana,
    hsnCode: '0803.90.10',
    placeOfOrigin: 'India',
    color: 'Natural Green',
    grade: '5 finger - 20 cm length minimum',
    description: 'Fresh harvested bananas with export quality',
    route:"/products/banana"
  },
  //  // COCO-PEAT
  // {
  //   id: 'coco-peat',
  //   name: 'Coco Peats',
  //   category: 'value-added',
  //   image: cocopeat,
  //   hsnCode: '5305.00.40',
  //   placeOfOrigin: 'India',
  //   color: 'Natural Brown',
  //   grade: 'Variants Available: 5kg / 650g / Grow Bags',
  //   description: 'Premium Export Grade Coco Peat Blocks – Ideal for Hydroponics, Greenhouse & Horticulture Applications.',
  //   route:"/products/coco-peats"
  // },
  // SWEET-POTATO
  {
    id: 'sweet-potato',
    name: 'Sweet Potato',
    category: 'agri-products',
    image: sweetpotato,
    hsnCode: '0714.20.00',
    placeOfOrigin: 'India',
    color: 'Reddish-brown skin with vibrant orange flesh',
    grade: 'A Grade / Export Quality / Uniform Size',
    description: 'Premium quality fresh sweet potatoes suitable for international export with rich taste and high nutritional value.',
    route:"/products/sweet-potato"
  }//,
  // YELLOW-PUMPKIN
  // {
  //   id: 'yellow-pumpkin',
  //   name: 'Yellow Pumpkin',
  //   category: 'agri-products',
  //   image: yellowpumpkin,
  //   hsnCode: '0709.93.10',
  //   placeOfOrigin: 'India',
  //   color: 'Golden yellow exterior with rich orange-yellow flesh',
  //   grade: 'A Grade / Matured / Export Quality',
  //   description: 'High quality fresh yellow pumpkins suitable for international export, known for their freshness and natural sweetness.',
  //   route:"/products/yellow-pumpkin"
  // }

];

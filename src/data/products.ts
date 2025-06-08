import { Product } from '../types';

import garlic from '../../dist/assets/img/garlic_powder.png';
import ginger from '../../dist/assets/img/ginger_powder.jpg';
import turmeric from '../../dist/assets/img/turmeric_powder.png';
import pepper from '../../dist/assets/img/pepper_powder.png';
import prawns from '../../dist/assets/img/prawns_dried.png';
import anchovy from '../../dist/assets/img/anchovy_dried.png';
import tableware from '../../dist/assets/img/ceramic_tableware.png';
import sculptures from '../../dist/assets/img/ceramic_sculptures.png';
import cookware from '../../dist/assets/img/ceramic_pottery.png';

export const products: Product[] = [
  // Spices
  {
    id: 'garlic-powder',
    name: 'Garlic Powder',
    category: 'spices',
    image: garlic,
    hsnCode: '0712.90.40',
    placeOfOrigin: 'India',
    color: 'Off White to Light Yellow',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Premium quality dehydrated garlic powder with rich aroma and flavor'
  },
  {
    id: 'ginger-powder',
    name: 'Ginger Powder',
    category: 'spices',
    image: ginger,
    hsnCode: '0910.11.10',
    placeOfOrigin: 'India',
    color: 'Light Brown to Yellowish',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Pure dried ginger powder with authentic taste and medicinal properties'
  },
  {
    id: 'turmeric-powder',
    name: 'Turmeric Powder',
    category: 'spices',
    image: turmeric,
    hsnCode: '0910.30.30',
    placeOfOrigin: 'India',
    color: 'Golden Yellow',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'High curcumin content turmeric powder with vibrant color and aroma'
  },
  {
    id: 'pepper-powder',
    name: 'Pepper Powder',
    category: 'spices',
    image: pepper,
    hsnCode: '0904.11.20',
    placeOfOrigin: 'India',
    color: 'Light Brown',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Finely ground pepper powder with fresh aroma and authentic flavor'
  },
  // Dry Fish
  // {
  //   id: 'bombay-duck',
  //   name: 'Bombay Duck (Dried)',
  //   category: 'dry-fish',
  //   image: 'https://images.pexels.com/photos/128408/pexels-photo-128408.jpeg',
  //   hsnCode: '0305 59 90',
  //   placeOfOrigin: 'India',
  //   color: 'Golden Brown',
  //   grade: 'Export Quality',
  //   transport: ['Air', 'Sea'],
  //   deliveryTime: {
  //     air: '~ 7-10 Days',
  //     sea: '~ 15-30 Days'
  //   },
  //   paymentTerms: '50% Adv | 50% OBL',
  //   description: 'Premium quality sun-dried Bombay duck with authentic taste'
  // },
  {
    id: 'prawns-dried',
    name: 'Dried Prawns',
    category: 'dry-fish',
    image: prawns,
    hsnCode: '0306.19.00',
    placeOfOrigin: 'India',
    color: 'Pinkish Orange',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'High-quality dried prawns processed under hygienic conditions'
  },
  {
    id: 'anchovy-dried',
    name: 'Dried Anchovy',
    category: 'dry-fish',
    image: anchovy,
    hsnCode: '0305.59.00',
    placeOfOrigin: 'India',
    color: 'Silver Gray',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Premium dried anchovies with natural flavor and high protein content'
  },
  // Handcrafted Items
  {
    id: 'tableware-earthenware',
    name: 'Tableware & Kitchenware',
    category: 'Earthenware',
    image: tableware,
    hsnCode: '6911.10 & 6912.00',
    placeOfOrigin: 'India',
    color: 'Multicolored',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Traditional Indian ceramic Plates, bowls, mugs, cups, saucers, Serving dishes, teapots, and jugs'
  },
  {
    id: 'decorative-earthenware',
    name: 'Decorative Ceramic Items',
    category: 'Earthenware',
    image: sculptures,
    hsnCode: '6913.10 / 6913.90',
    placeOfOrigin: 'India',
    color: 'Multicolored',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Indian made ceramic Vases, sculptures, candle holders, Garden planters'
  },
  {
    id: 'cookware-earthenware',
    name: 'Ceramic Cookware',
    category: 'Earthenware',
    image: cookware,
    hsnCode: '6912.00',
    placeOfOrigin: 'India',
    color: 'Multicolored',
    grade: 'Export Quality',
    transport: ['Air', 'Sea'],
    deliveryTime: {
      air: '~ 7-10 Days',
      sea: '~ 15-30 Days'
    },
    paymentTerms: '50% Adv | 50% OBL',
    description: 'Exquisite ceramic Clay pots, baking dishes, tagines, casseroles'
  }
];
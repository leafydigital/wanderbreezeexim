import { Certification } from '../types';

export const certifications: Certification[] = [
  {
    id: 'apeda',
    name: 'APEDA',
    number: 'RCMC/APEDA/27683/2025-2026',
    authority: 'Agricultural and Processed Food Products Export Development Authority',
    description: 'Required for exporting scheduled agricultural and food products from India'
  },
  {
    id: 'iec',
    name: 'IEC',
    number: 'AAECW0943R',
    authority: 'Directorate General of Foreign Trade (DGFT)',
    description: 'Essential for customs clearance for importing into or exporting from India'
  },
  {
    id: 'lut',
    name: 'LUT',
    number: '32AAECW0943R1ZY',
    authority: 'Government of India',
    description: 'Allows exporters to supply goods or services without payment of GST under bond or LUT, enabling tax-free exports and improved cash flow.'
  },
  {
    id: 'gst',
    name: 'GST Registration',
    number: '32AAECW0943R1ZY',
    authority: 'Government of India',
    description: 'Goods and Services Tax registration for legitimate business operations'
  },

  {
    id: 'fssai',
    name: 'FSSAI Central License',
    number: '11325999000956',
    authority: 'Food Safety and Standards Authority of India',
    description: 'Central food license for manufacturing and export of food products'
  },
  
  
  // {
  //   id: 'spice-board',
  //   name: 'Spices Board Registration',
  //   number: 'SB/EXP/2023/6789',
  //   authority: 'Indian Spices Board',
  //   description: 'Authorized exporter of spices under Indian Spices Board'
  // },
  // {
  //   id: 'iso',
  //   name: 'ISO 22000:2018',
  //   number: 'ISO-22000-2023-001',
  //   authority: 'International Organization for Standardization',
  //   description: 'Food Safety Management System certification'
  // },
  // {
  //   id: 'haccp',
  //   name: 'HACCP Certification',
  //   number: 'HACCP-2023-WBE-001',
  //   authority: 'Hazard Analysis Critical Control Points',
  //   description: 'Food safety management system based on prevention'
  // }
];
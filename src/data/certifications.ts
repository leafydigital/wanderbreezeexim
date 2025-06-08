import { Certification } from '../types';

export const certifications: Certification[] = [
  {
    id: 'gst',
    name: 'GST Registration',
    number: '27AABCW1234D1Z5',
    authority: 'Government of India',
    description: 'Goods and Services Tax registration for legitimate business operations'
  },
  {
    id: 'fssai',
    name: 'FSSAI Central License',
    number: '12345678901234',
    authority: 'Food Safety and Standards Authority of India',
    description: 'Central food license for manufacturing and export of food products'
  },
  {
    id: 'apeda',
    name: 'APEDA Registration',
    number: 'AP/EXP/2023/12345',
    authority: 'Agricultural and Processed Food Products Export Development Authority',
    description: 'Registration for export of agricultural and processed food products'
  },
  {
    id: 'spice-board',
    name: 'Spices Board Registration',
    number: 'SB/EXP/2023/6789',
    authority: 'Indian Spices Board',
    description: 'Authorized exporter of spices under Indian Spices Board'
  },
  {
    id: 'iso',
    name: 'ISO 22000:2018',
    number: 'ISO-22000-2023-001',
    authority: 'International Organization for Standardization',
    description: 'Food Safety Management System certification'
  },
  {
    id: 'haccp',
    name: 'HACCP Certification',
    number: 'HACCP-2023-WBE-001',
    authority: 'Hazard Analysis Critical Control Points',
    description: 'Food safety management system based on prevention'
  }
];
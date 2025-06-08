export interface Product {
  id: string;
  name: string;
  category: 'spices' | 'dry-fish' | 'Earthenware';
  image: string;
  hsnCode: string;
  placeOfOrigin: string;
  color: string;
  grade: string;
  transport: string[];
  deliveryTime: {
    air: string;
    sea: string;
  };
  paymentTerms: string;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  number: string;
  authority: string;
  description: string;
}
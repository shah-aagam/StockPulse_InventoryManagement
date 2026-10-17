import { Product } from '../models/index.js';

async function seedDemoData(enabled) {
  if (!enabled || await Product.exists({})) return;
  const rows = [
    ['PRD-001','SKU-ELEC-001','Wireless Earbuds Pro','ELECTRONICS',79.99,45,20,3],
    ['PRD-002','SKU-ELEC-002','USB-C Hub 7-Port','ELECTRONICS',34.99,120,30,1],
    ['PRD-003','SKU-APP-001','Organic Cotton T-Shirt','APPAREL',24.99,16,15,12],
    ['PRD-004','SKU-APP-002','Running Shorts Navy','APPAREL',39.99,55,20,2],
    ['PRD-005','SKU-HOME-001','Ceramic Pour-Over Set','HOME',49.99,22,10,4],
    ['PRD-006','SKU-HOME-002','LED Desk Lamp','HOME',59.99,0,15,0],
    ['PRD-007','SKU-ELEC-003','Portable Charger 20K','ELECTRONICS',44.99,18,25,8],
    ['PRD-008','SKU-APP-003','Hoodie Heather Grey','APPAREL',54.99,11,12,15],
  ];
  await Product.insertMany(rows.map(([id, sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity]) => ({
    _id: id, sku, name, category, currentPrice, stockLevel, reorderThreshold, demandVelocity,
    status: stockLevel === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
  })));
}

export default seedDemoData;

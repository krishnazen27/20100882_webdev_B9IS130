require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const Shipment = require('./src/models/Shipment.model');
const CustomsDeclaration = require('./src/models/CustomsDeclaration.model');

const vessels = [
  'MV SKR Atlantic Horizon', 'MSC Dublin Express', 'Maersk Emerald', 'CMA CGM Hibernia',
  'Hapag-Lloyd Celtic', 'Evergreen Shamrock', 'ONE Liffey Voyager', 'COSCO Fastnet',
  'NYK Shannon Star', 'OOCL Galway Bay'
];

const ports = [
  'IEDUB', 'IECOR', 'IELMK', 'IEWAT', 'NLRTM',
  'DEHAM', 'BEANR', 'FRLEH', 'GBFXT', 'SGSIN', 'CNSHA', 'USNYC'
];

const cargoes = [
  { desc: 'Server Racks & Cloud Networking Switches', hs: '8471.50' },
  { desc: 'Biopharmaceutical Cold-Chain Reagents', hs: '3002.15' },
  { desc: 'Industrial CNC Precision Components', hs: '8466.93' },
  { desc: 'Irish Cream Liqueur & Craft Spirits', hs: '2208.70' },
  { desc: 'Medical Diagnostic Imaging Equipment', hs: '9018.19' },
  { desc: 'Lithium-Ion Grid Storage Modules', hs: '8507.60' },
  { desc: 'Automotive EV Powertrain Assemblies', hs: '8708.99' },
  { desc: 'Dairy Milk Powder Bulk Sacks', hs: '0402.21' },
  { desc: 'Solar Photovoltaic Inverter Units', hs: '8504.40' },
  { desc: 'Semiconductor Wafer Fabrication Parts', hs: '8486.90' }
];

const statuses = ['BOOKED', 'IN_TRANSIT', 'ARRIVED_AT_PORT', 'CUSTOMS_HOLD', 'CLEARED', 'DELIVERED'];
const shipmentTypes = ['IMPORT', 'EXPORT', 'TRANSSHIPMENT'];
const containerSizes = ['20GP', '40GP', '40HC', '20RF', '40RF'];
const carrierPrefixes = ['MSCU', 'MAEU', 'CMAU', 'HLCU', 'OOLU'];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB Atlas...');

    await Promise.all([
      User.deleteMany({}),
      Shipment.deleteMany({}),
      CustomsDeclaration.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing Users, Shipments, and Customs Declarations.');

    const users = await User.create([
      {
        fullName: 'SKR-Global Administrator',
        email: 'admin@skr-global.com',
        password: 'Password123!',
        role: 'admin',
        companyName: 'SKR-Global'
      },
      {
        fullName: 'Liam OConnor',
        email: 'operator@skr-global.com',
        password: 'Password123!',
        role: 'operator',
        companyName: 'SKR-Global'
      },
      {
        fullName: 'Aoife Murphy',
        email: 'customs@skr-global.com',
        password: 'Password123!',
        role: 'customs',
        companyName: 'SKR-Global Customs Division'
      },
      {
        fullName: 'Declan Byrne',
        email: 'client@skr-global.com',
        password: 'Password123!',
        role: 'client',
        companyName: 'SKR-Global Client Logistics'
      }
    ]);

    const operatorUser = users[1];
    const customsUser = users[2];
    const clientUser = users[3];

    const shipmentsToInsert = [];
    const baseDate = new Date('2026-11-01T08:00:00Z');

    for (let i = 1; i <= 50; i++) {
      const paddedNum = String(i).padStart(3, '0');
      const pol = ports[i % ports.length];
      let pod = ports[(i + 3) % ports.length];
      if (pol === pod) pod = 'IEDUB';

      const cargo = cargoes[i % cargoes.length];
      const status = statuses[i % statuses.length];
      const type = shipmentTypes[i % shipmentTypes.length];
      const valueUSD = 15000 + i * 2450;

      const etd = new Date(baseDate.getTime() + i * 12 * 60 * 60 * 1000);
      const eta = new Date(etd.getTime() + (7 + (i % 14)) * 24 * 60 * 60 * 1000);

      const containerCount = (i % 2) + 1;
      const containers = [];
      for (let c = 0; c < containerCount; c++) {
        const prefix = carrierPrefixes[(i + c) % carrierPrefixes.length];
        const digits = String(1000000 + i * 137 + c).slice(0, 7);
        containers.push({
          containerNumber: `${prefix}${digits}`,
          sizeType: containerSizes[(i + c) % containerSizes.length],
          sealNumber: `SKR-${2026}${paddedNum}-${c + 1}`,
          grossWeightKg: 11500 + ((i * 350 + c * 1200) % 14000)
        });
      }

      shipmentsToInsert.push({
        billOfLading: `BOL2026SKR${paddedNum}`,
        shipmentType: type,
        vesselName: vessels[i % vessels.length],
        voyageNumber: `SKR-${100 + i}W`,
        portOfLoading: pol,
        portOfDischarge: pod,
        etd,
        eta,
        cargoDescription: cargo.desc,
        hsCode: cargo.hs,
        declaredValueUSD: valueUSD,
        containers,
        status,
        client: clientUser._id,
        createdBy: operatorUser._id
      });
    }

    const createdShipments = await Shipment.insertMany(shipmentsToInsert);
    console.log(`[Seed] Inserted ${createdShipments.length} SKR-Global shipments.`);

    const declarationsToInsert = createdShipments.map((shipment, idx) => {
      const paddedNum = String(idx + 1).padStart(3, '0');
      let clearanceStatus = 'PENDING';
      if (shipment.status === 'CLEARED' || shipment.status === 'DELIVERED') {
        clearanceStatus = 'APPROVED';
      } else if (shipment.status === 'CUSTOMS_HOLD') {
        clearanceStatus = 'REJECTED';
      } else if (shipment.status === 'ARRIVED_AT_PORT') {
        clearanceStatus = 'UNDER_REVIEW';
      }

      const duty = Number((shipment.declaredValueUSD * 0.045).toFixed(2));
      const vat = Number(((shipment.declaredValueUSD + duty) * 0.23).toFixed(2));

      return {
        declarationNumber: `SAD-SKR-2026-${paddedNum}`,
        shipment: shipment._id,
        tariffClassification: shipment.hsCode,
        dutyAssessedUSD: duty,
        vatAssessedUSD: vat,
        inspectionRequired: clearanceStatus === 'REJECTED',
        clearanceStatus,
        officerNotes:
          clearanceStatus === 'APPROVED'
            ? 'Manifest verified against SKR-Global Bill of Lading. Cleared for port release.'
            : clearanceStatus === 'REJECTED'
              ? 'Discrepancy in HS tariff valuation — physical container scan required.'
              : clearanceStatus === 'UNDER_REVIEW'
                ? 'Vessel arrived at port; customs officer reviewing commercial invoice.'
                : 'Awaiting vessel arrival and final customs inspection.',
        ...(clearanceStatus !== 'PENDING' && {
          reviewedBy: customsUser._id,
          reviewedAt: new Date()
        })
      };
    });

    const createdDeclarations = await CustomsDeclaration.insertMany(declarationsToInsert);
    console.log(`[Seed] Inserted ${createdDeclarations.length} customs declarations.`);

    console.log('--- SKR-Global Seed Complete! Demo Logins (Password: Password123!) ---');
    console.log('Admin:    admin@skr-global.com');
    console.log('Operator: operator@skr-global.com');
    console.log('Customs:  customs@skr-global.com');
    console.log('Client:   client@skr-global.com');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

seedDatabase();

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// function rand(min: number, max: number) {
//   return Math.random() * (max - min) + min;
// }

// function randint(min: number, max: number) {
//   return Math.floor(rand(min, max + 1));
// }

// function sample<T>(arr: readonly T[]): T {
//   return arr[Math.floor(Math.random() * arr.length)];
// }

// function jitterCoord(base: { lat: number; lng: number }, radiusKm = 10) {
//   // Roughly ~0.009 degrees lat per km; lng scaled by cos(lat)
//   const latJ = (Math.random() - 0.5) * 2 * (radiusKm * 0.009);
//   const lngJ = (Math.random() - 0.5) * 2 * (radiusKm * 0.009 * Math.cos((base.lat * Math.PI) / 180));
//   return { lat: base.lat + latJ, lng: base.lng + lngJ };
// }

// async function main() {
//   console.log("Seeding database...");

//   // Clean existing (idempotent for demo purposes)
//   await prisma.workOrderInventory.deleteMany();
//   await prisma.billing.deleteMany();
//   await prisma.technicianSchedule.deleteMany();
//   await prisma.workOrder.deleteMany();
//   await prisma.inventoryItem.deleteMany();
//   await prisma.customer.deleteMany();
//   await prisma.technician.deleteMany();
//   await prisma.user.deleteMany();

//   // City center (example: San Francisco)
//   const city = { lat: 37.7749, lng: -122.4194 };

//   // Users & Technicians
//   const admin = await prisma.user.create({
//     data: {
//       name: "Admin User",
//       email: "admin@example.com",
//       password: "password",
//       role: "ADMIN" as any,
//     },
//   });

//   const techNames = ["John Doe", "Emily Smith", "Raj Kumar"];
//   const skillsPool = ["Electrical", "HVAC", "Plumbing"];

//   const techUsers = await Promise.all(
//     techNames.map((name, i) =>
//       prisma.user.create({
//         data: {
//           name,
//           email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
//           password: "password",
//           role: "TECHNICIAN" as any,
//         },
//       })
//     )
//   );

//   const technicians = await Promise.all(
//     techUsers.map((u) => {
//       const { lat, lng } = jitterCoord(city, 8);
//       const techSkills = skillsPool.slice(0, randint(1, skillsPool.length));
//       return prisma.technician.create({
//         data: {
//           userId: u.id,
//           currentStatus: "AVAILABLE" as any,
//           currentLat: lat,
//           currentLng: lng,
//           skills: techSkills,
//         },
//         include: { user: true },
//       });
//     })
//   );

//   // Customers
//   const customersSeed = [
//     { name: "Alice Johnson", address: "123 Maple Street" },
//     { name: "Bob Williams", address: "456 Oak Avenue" },
//     { name: "Carol Davis", address: "789 Pine Road" },
//     { name: "David Brown", address: "321 Cedar Lane" },
//     { name: "Eva Miller", address: "654 Birch Boulevard" },
//     { name: "Frank Wilson", address: "987 Elm Street" },
//   ];

//   const customers = await Promise.all(
//     customersSeed.map((c) => {
//       const { lat, lng } = jitterCoord(city, 10);
//       return prisma.customer.create({
//         data: {
//           name: c.name,
//           address: c.address,
//           latitude: lat,
//           longitude: lng,
//           email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
//           phone: `+1-555-${randint(1000000, 9999999)}`,
//         },
//       });
//     })
//   );

//   // Inventory Items
//   const inventoryNames = ["Air Filter", "Copper Pipe", "Fuse Box", "Valve Kit", "Thermostat"];
//   const inventory = await Promise.all(
//     inventoryNames.map((name, idx) =>
//       prisma.inventoryItem.create({
//         data: {
//           name,
//           sku: `${name.toUpperCase().replace(/\s+/g, "-")}-${1000 + idx}`,
//           quantity: randint(10, 50),
//           unitPrice: Math.round(rand(20, 150) * 100) / 100,
//         },
//       })
//     )
//   );

//   // Work Orders
//   const descriptions = [
//     "Air conditioner service",
//     "Pipe leakage repair",
//     "Electrical wiring check",
//     "Thermostat calibration",
//     "HVAC filter replacement",
//     "Water heater inspection",
//   ];
//   const statuses = [
//     "PENDING",
//     "SCHEDULED",
//     "IN_PROGRESS",
//     "COMPLETED",
//   ] as const;
//   const priorities = ["LOW", "MEDIUM", "HIGH"] as const;

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const workOrders = await Promise.all(
//     Array.from({ length: 6 }).map(async (_, i) => {
//       const customer = sample(customers);
//       const technician = sample(technicians);
//       const status = sample(statuses);
//       const priority = sample(priorities);
//       const scheduledDate = new Date(today);
//       scheduledDate.setDate(today.getDate() + randint(0, 3));

//       const wo = await prisma.workOrder.create({
//         data: {
//           title: `Work Order #${100 + i}`,
//           description: sample(descriptions),
//           status,
//           priority,
//           scheduledDate,
//           customerId: customer.id,
//           technicianId: technician.id,
//         },
//       });

//       // Optionally connect some inventory items used (random)
//       if (Math.random() > 0.5) {
//         const item = sample(inventory);
//         await prisma.workOrderInventory.create({
//           data: {
//             workOrderId: wo.id,
//             inventoryId: item.id,
//             quantityUsed: randint(1, 3),
//           },
//         });
//       }

//       // Billing for completed
//       if (status === "COMPLETED") {
//         await prisma.billing.create({
//           data: {
//             workOrderId: wo.id,
//             totalAmount: Math.round(rand(100, 500) * 100) / 100,
//             status: "PAID" as any,
//             invoiceNumber: `INV-${randint(10000, 99999)}`,
//           },
//         });
//       } else {
//         await prisma.billing.create({
//           data: {
//             workOrderId: wo.id,
//             totalAmount: 0,
//             status: "PENDING" as any,
//           },
//         });
//       }

//       return wo;
//     })
//   );

//   // Technician Schedules for today
//   for (const tech of technicians) {
//     const assigned = workOrders.filter((w) => w.technicianId === tech.id);
//     const routeOrder = assigned.map((w) => w.id);
//     await prisma.technicianSchedule.create({
//       data: {
//         technicianId: tech.id,
//         date: new Date(today),
//         routeOrder,
//         totalDistance: Math.round(rand(10, 40) * 10) / 10,
//         totalDuration: randint(60, 180),
//       },
//     });
//   }

//   // Summary
//   const [userCount, techCount, customerCount, itemCount, woCount, billingCount, scheduleCount] = await Promise.all([
//     prisma.user.count(),
//     prisma.technician.count(),
//     prisma.customer.count(),
//     prisma.inventoryItem.count(),
//     prisma.workOrder.count(),
//     prisma.billing.count(),
//     prisma.technicianSchedule.count(),
//   ]);

//   console.log("Seed complete:");
//   console.log({ userCount, techCount, customerCount, itemCount, woCount, billingCount, scheduleCount });
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });



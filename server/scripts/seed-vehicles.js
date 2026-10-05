import "../env.js";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const prisma = new PrismaClient();

async function main() {
    console.log("🚗 Starting vehicle seed...");

    try {
        // 1. Create vehicle makes
        console.log("\n📋 Creating vehicle makes...");
        const makes = ["Toyota", "Honda", "Ford", "Hyundai", "Mitsubishi"];
        const createdMakes = [];

        for (const makeName of makes) {
            let make = await prisma.vehicle_make.findFirst({
                where: { name: makeName },
            });
            if (!make) {
                make = await prisma.vehicle_make.create({
                    data: { name: makeName },
                });
                console.log(`✅ Make created: ${makeName} (ID: ${make.id_})`);
            } else {
                console.log(`✅ Make exists: ${makeName} (ID: ${make.id_})`);
            }
            createdMakes.push(make);
        }

        // 2. Create vehicle models
        console.log("\n📋 Creating vehicle models...");
        const models = ["Hiace", "Civic", "Transit", "H350", "L300"];
        const createdModels = [];

        for (const modelName of models) {
            let model = await prisma.vehicle_model.findFirst({
                where: { name: modelName },
            });
            if (!model) {
                model = await prisma.vehicle_model.create({
                    data: { name: modelName },
                });
                console.log(`✅ Model created: ${modelName} (ID: ${model.id_})`);
            } else {
                console.log(`✅ Model exists: ${modelName} (ID: ${model.id_})`);
            }
            createdModels.push(model);
        }

        // 3. Create sample vehicles
        console.log("\n📋 Creating sample vehicles...");
        const vehicles = [
            {
                plate_number: "ABC-1234",
                year: 2022,
                vehicle_type: "VAN",
                weight_capacity: 1500,
                initial_odometer: 0,
                expected_kml: 8,
                target_efficiency: 8.5,
                conduction_sticker: "2024-12-31",
                reg_certification: "REG001",
                or_number: "OR001",
                registration_expiry: new Date("2025-12-31"),
                insurance_expiry: new Date("2025-06-30"),
                make_id_: createdMakes[0].id_,
                model_id_: createdModels[0].id_,
                is_active: true,
            },
            {
                plate_number: "DEF-5678",
                year: 2021,
                vehicle_type: "MOTORCYCLE",
                weight_capacity: 100,
                initial_odometer: 5000,
                expected_kml: 7,
                target_efficiency: 7.2,
                conduction_sticker: "2024-11-30",
                reg_certification: "REG002",
                or_number: "OR002",
                registration_expiry: new Date("2025-11-30"),
                insurance_expiry: new Date("2025-05-30"),
                make_id_: createdMakes[1].id_,
                model_id_: createdModels[1].id_,
                is_active: true,
            },
            {
                plate_number: "GHI-9012",
                year: 2023,
                vehicle_type: "CAR",
                weight_capacity: 500,
                initial_odometer: 2000,
                expected_kml: 9,
                target_efficiency: 9.5,
                conduction_sticker: "2025-01-31",
                reg_certification: "REG003",
                or_number: "OR003",
                registration_expiry: new Date("2026-01-31"),
                insurance_expiry: new Date("2025-07-31"),
                make_id_: createdMakes[2].id_,
                model_id_: createdModels[2].id_,
                is_active: true,
            },
        ];

        for (const vehicleData of vehicles) {
            const existingVehicle = await prisma.vehicle.findFirst({
                where: { plate_number: vehicleData.plate_number },
            });

            if (!existingVehicle) {
                console.log(`\nCreating vehicle: ${vehicleData.plate_number}`);
                console.log(`  - Make ID: ${vehicleData.make_id_}`);
                console.log(`  - Model ID: ${vehicleData.model_id_}`);
                
                const vehicle = await prisma.vehicle.create({
                    data: vehicleData,
                    include: { vehicle_make: true, vehicle_model: true },
                });
                console.log(
                    `✅ Vehicle created: ${vehicleData.plate_number} - ${vehicle.vehicle_make?.name || 'N/A'} ${vehicle.vehicle_model?.name || 'N/A'}`
                );
            } else {
                console.log(
                    `⏭️  Vehicle already exists: ${vehicleData.plate_number}`
                );
            }
        }

        console.log("\n✨ Vehicle seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed error:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
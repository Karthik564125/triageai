const bcrypt = require("bcryptjs");
const { db } = require("./config/firebase");

const teamMembers = [
    { name: "Arjun", role: "team_member", team: "Platform Engineering", active: true },
    { name: "Rahul", role: "team_member", team: "Application Engineering", active: true },
    { name: "Vikram", role: "team_member", team: "Security", active: true },
    { name: "Suresh", role: "team_member", team: "DevOps", active: true },
    { name: "Naveen", role: "team_member", team: "Database Team", active: true },
    { name: "Rohit", role: "team_member", team: "Billing Team", active: true },
    { name: "Kiran", role: "team_member", team: "Customer Support", active: true },
    { name: "Aditya", role: "team_member", team: "Product Team", active: true },
];

const teams = [
    "Platform Engineering",
    "Application Engineering",
    "Security",
    "DevOps",
    "Database Team",
    "Billing Team",
    "Customer Support",
    "Product Team",
];

async function seedDatabase() {
    try {
        console.log("Cleaning old users and teams from Firestore...");

        // 1. Wipe existing users collection
        const existingUsers = await db.collection("users").get();
        const batch1 = db.batch();
        existingUsers.forEach((doc) => {
            batch1.delete(doc.ref);
        });
        await batch1.commit();
        console.log("Cleared old users collection.");

        // 2. Wipe existing teams collection
        const existingTeams = await db.collection("teams").get();
        const batch2 = db.batch();
        existingTeams.forEach((doc) => {
            batch2.delete(doc.ref);
        });
        await batch2.commit();
        console.log("Cleared old teams collection.");

        // 3. Hash passwords with bcryptjs
        const clientPasswordHash = await bcrypt.hash("karthik123", 10);
        const adminPasswordHash = await bcrypt.hash("admin123", 10);

        const now = new Date().toISOString();

        // 4. Create ONLY the two application login users
        const usersToCreate = [
            {
                name: "Karthik",
                username: "karthik",
                passwordHash: clientPasswordHash,
                role: "client",
                active: true,
                createdAt: now
            },
            {
                name: "Admin",
                username: "admin",
                passwordHash: adminPasswordHash,
                role: "admin",
                active: true,
                createdAt: now
            }
        ];

        console.log("Seeding application login users (Karthik & Admin)...");
        for (const user of usersToCreate) {
            await db.collection("users").add(user);
        }

        // 5. Seed team members (for Admin assignment, NO passwords/login roles)
        console.log("Seeding assignment-only team members...");
        for (const member of teamMembers) {
            await db.collection("users").add({
                ...member,
                createdAt: now
            });
        }

        // 6. Seed teams
        console.log("Seeding teams...");
        for (const teamName of teams) {
            await db.collection("teams").add({
                name: teamName,
                active: true,
                createdAt: now
            });
        }

        console.log("Database seeding completed successfully!");
        console.log("Created users:");
        console.log("  1) username: karthik | role: client | passwordHash: bcrypt hash");
        console.log("  2) username: admin   | role: admin  | passwordHash: bcrypt hash");
        console.log("Confirmed: NO plaintext passwords stored in database.");

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedDatabase();
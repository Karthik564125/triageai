require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { db } = require("./config/firebase");


const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/teams", teamRoutes);

app.get("/api/health", async (req, res) => {
    try {
        await db.collection("health").doc("test").set({
            status: "connected",
            timestamp: new Date().toISOString(),
        });

        res.json({
            success: true,
            message: "Backend + Firestore connected successfully",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Firestore connection failed",
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
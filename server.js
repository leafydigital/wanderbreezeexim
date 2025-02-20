require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();

// ✅ Enable CORS for your frontend
const allowedOrigins = [
  "https://bright-hotteok-8fc084.netlify.app",
  "https://wanderbreezeexim.com/"
];


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
},
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
}));

app.use(express.json());

// ✅ Handle CORS Preflight Requests
app.options("*", cors());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define Mongoose Schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model("Contact", contactSchema);

// ✅ Setup Nodemailer (with error handling)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
    },
});

// ✅ API Route to Handle Contact Form
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // ✅ Save to MongoDB
        const newContact = new Contact({ name, email, phone, message });
        await newContact.save();

        // ✅ Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "samrajakumarmdr@gmail.com",
            subject: `New Contact Message - ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        };
        
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Message Sent Successfully!" });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

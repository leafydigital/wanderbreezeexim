require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();

// ✅ Enable CORS for your frontend
const allowedOrigins = [
  "https://bright-hotteok-8fc084.netlify.app",
  "https://wanderbreezeexim.com"
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
        const { company_name, name, email, phone, country, message } = req.body;

        if (!company_name || !name || !email || !phone || !country || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // ✅ Save to MongoDB
        const newContact = new Contact({ company_name, name, email, phone, country, message });
        await newContact.save();

        // ✅ Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "samrajakumarmdr@gmail.com",
            cc: "abitha.d.official@gmail.com",
            subject: `New Contact Message - ${name}`,
            text: `Company Name: ${company_name}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\Country: ${country}\nMessage: ${message}`,
        };
        
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Message Sent Successfully!" });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

////////////////////////////////Leafy Digital Contact Starts///////////////////////////////////////////////////

// ✅ Define Mongoose Schema
// const LeafyDigitalcontactSchema = new mongoose.Schema({
//     name: String,
//     email: String,
//     company: String,
//     message: String,
//     createdAt: { type: Date, default: Date.now }
// }); //sometimes not needed
// const LeafyDigitalContact = mongoose.model("LeafyDigitalContact", LeafyDigitalcontactSchema); //sometimes not needed

// ✅ Setup Nodemailer (with error handling)
// const LeafyDigitaltransporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER || "",
//         pass: process.env.EMAIL_PASS || "",
//     },
// });

// ✅ API Route to Handle Contact Form
app.post("/api/leafycontact", async (req, res) => {
    try {
        const { name, email, company, message } = req.body;

        if (!name || !email || !company || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // ✅ Save to MongoDB
        // const newContact = new Contact({ name, email, phone, message });
        // await newContact.save();

        // ✅ Send Email Notification
        const LeafymailOptions = {
            from: process.env.EMAIL_USER,
            to: "samrajakumarmdr@gmail.com",
            cc: "abitha.d.official@gmail.com",
            subject: `New Enquiry Message - ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nMessage: ${message}`,
        };
        
        await transporter.sendMail(LeafymailOptions);//using the same transporter without using new one for leafy digital

        res.json({ success: true, message: "Message Sent Successfully!" });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


////////////////////////////////Leafy Digital Contact Ends////////////////////////////////////////////////////

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

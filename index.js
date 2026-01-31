require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const authRoutes = require("./routes/auth");

const app = express();

/* Middleware */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

/* Session */


app.set("trust proxy", 1); // ✅ Render ke liye MUST

app.use(
  session({
    name: "foodorder.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only
      httpOnly: true,
      sameSite: "none", // Render ke liye IMPORTANT
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


/* MongoDB */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Error:", err.message);
    process.exit(1);
  });

/* Routes */
app.use("/", authRoutes);
app.get("/", (req, res) => res.redirect("/login"));

/* Server */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

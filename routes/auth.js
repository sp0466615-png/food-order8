const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const User = require("../models/User");
const Order = require("../models/Order"); // ✅ ORDER MODEL ADD

const router = express.Router();


/* ---------- AUTH MIDDLEWARE ---------- */
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

/* ---------- REGISTER ---------- */
router.get("/register", (req, res) => {
  res.sendFile(process.cwd() + "/views/register.html");
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) return res.send("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  await new User({ name, email, password: hashedPassword }).save();

  res.redirect("/login");
});

/* ---------- LOGIN ---------- */
router.get("/login", (req, res) => {
  res.sendFile(process.cwd() + "/views/login.html");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.redirect("/login");

  req.session.userId = user._id;
  res.redirect("/page");
});

/* ---------- LOGOUT ---------- */
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

/* ---------- PAGES ---------- */
router.get("/page", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/page.html");
});

router.get("/menu", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/menu.html");
});

router.get("/profile", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/profile.html");
});

router.get("/about", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/about.html");
});

router.get("/contact", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/contact.html");
});

router.get("/order", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/order.html");
});

router.get("/book-summary", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/book-summary.html");
});

router.get("/confirm-order", isAuthenticated, (req, res) => {
  res.sendFile(process.cwd() + "/views/confirm-order.html");
});

/* ---------- BOOK ITEM (SAVE TO SESSION) ---------- */
router.post("/book-summary", isAuthenticated, (req, res) => {
  let items = req.body.items;

  if (!items) return res.redirect("/menu");

  if (!Array.isArray(items)) items = [items];

  req.session.order = items.map(i => {
    const [id, name, price] = i.split("|");
    return {
      name,
      price: Number(price),
      qty: 1,
    };
  });

  console.log("Saved Order (Session):", req.session.order);

  res.redirect("/book-summary");
});

/* ---------- CONFIRM ORDER (SAVE TO DATABASE) ---------- */
router.post("/confirm-order", isAuthenticated, async (req, res) => {
  try {
    const orderItems = req.session.order;

    if (!orderItems || orderItems.length === 0) {
      return res.redirect("/menu");
    }

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const newOrder = new Order({
      userId: req.session.userId,
      items: orderItems,
      totalAmount
    });

    await newOrder.save();

    console.log("Order Saved to DB:", newOrder);

    // clear session cart
    req.session.order = [];

    res.redirect(`/confirm-order?total=${totalAmount}`);
  } catch (error) {
    console.error(error);
    res.send("Order not saved");
  }
});

/* ---------- ORDER DATA API ---------- */
router.get("/order-data", isAuthenticated, (req, res) => {
  res.json(req.session.order || []);
});

module.exports = router;

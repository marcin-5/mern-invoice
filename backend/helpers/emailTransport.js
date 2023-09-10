import "dotenv/config";
import nodemiler from "nodemailer";

let transporter;
if (process.env.NODE_ENV === "development") {
  transporter = nodemiler.createTransport({
    host: "mailhog",
    port: 1025,
  });
} else if (process.env.NODE_ENV === "production") {
  // TODO: configure mailgun in production
}

export default transporter;

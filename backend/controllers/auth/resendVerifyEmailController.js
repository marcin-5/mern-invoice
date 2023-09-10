import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";
import { throw400Error } from "../../utils/throwError.js";

const domainURL = process.env.DOMAIN;
const { randomBytes } = await import("crypto");

// $-title   Resend Email Verification Tokens
// $-path    POST /api/v1/auth/resend_email_token
// $-auth    Public

const resendEmailVerificationToken = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!email) throw400Error(res, "An email must be provided");

  if (!user)
    throw400Error(res, "We were unable to find a user with that email address");

  if (user.isEmailVerified)
    throw400Error(res, "This account has already been verified. Please login");

  let verificationToken = await VerificationToken.findOne({
    _userId: user._id,
  });

  if (verificationToken) {
    await VerificationToken.deleteOne();
  }

  const resentToken = randomBytes(32).toString("hex");

  let emailToken = await new VerificationToken({
    _userId: user._id,
    token: resentToken,
  }).save();

  const emailLink = `${domainURL}/api/v1/auth/verify/${emailToken.token}/${user._id}`;

  const payload = {
    name: user.firstName,
    link: emailLink,
  };

  await sendEmail(
    user.email,
    "Account Verification",
    payload,
    "./templates/email/accountVerification.handlebars"
  );

  res.json({
    success: true,
    message: `${user.firstName}, an email has been sent to your account, please verify within 15 minutes`,
  });
});

export default resendEmailVerificationToken;

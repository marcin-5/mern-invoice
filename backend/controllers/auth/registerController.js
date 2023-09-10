import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";
import { throw400Error } from "../../utils/throwError.js";

const domainURL = process.env.DOMAIN;

const { randomBytes } = await import("crypto");

// $-title   Register User and send email verification link
// $-path    POST /api/v1/auth/register
// $-auth    Public

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, firstName, lastName, password, passwordConfirm } =
    req.body;

  if (!email) throw400Error(res, "An email address is required");

  if (!username) throw400Error(res, "A username is required");

  if (!firstName || !lastName)
    throw400Error(res, "You must enter a full name with a first and last name");

  if (!password) throw400Error(res, "You must enter a password");

  if (!passwordConfirm)
    throw400Error(res, "Confirm password field is required");

  const userExists = await User.findOne({ email });

  if (userExists)
    throw400Error(
      res,
      "The email address you've entered is already associated with another account"
    );

  const newUser = new User({
    email,
    username,
    firstName,
    lastName,
    password,
    passwordConfirm,
  });

  const registeredUser = await newUser.save();

  if (!registeredUser) throw new Error("User could not be registered");

  if (registeredUser) {
    const verificationToken = randomBytes(32).toString("hex");

    let emailVerificationToken = await new VerificationToken({
      _userId: registeredUser._id,
      token: verificationToken,
    }).save();

    const emailLink = `${domainURL}/api/v1/auth/verify/${emailVerificationToken.token}/${registeredUser._id}`;

    const payload = {
      name: registeredUser.firstName,
      link: emailLink,
    };

    await sendEmail(
      registeredUser.email,
      "Account Verification",
      payload,
      "./templates/email/accountVerification.handlebars"
    );

    res.json({
      success: true,
      message: `A new user ${registeredUser.firstName} has been registered! A Verification email has been sent to your account. Please verify within 15 minutes`,
    });
  }
});

export default registerUser;

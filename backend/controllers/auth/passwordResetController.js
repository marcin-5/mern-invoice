import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import VerificationToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";
import { throw400Error } from "../../utils/throwError.js";

const domainURL = process.env.DOMAIN;
const { randomBytes } = await import("crypto");

// $-title   Send password reset email link
// $-path    POST /api/v1/auth/reset_password_request
// $-auth    Public

const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw400Error(res, "You must enter your email address");

  const existingUser = await User.findOne({ email }).select("-passwordConfirm");

  if (!existingUser)
    throw400Error(res, "That email is not associated with any account");

  let verificationToken = await VerificationToken.findOne({
    _userId: existingUser._id,
  });

  if (verificationToken) {
    await verificationToken.deleteOne();
  }

  const resetToken = randomBytes(32).toString("hex");

  let newVerificationToken = await new VerificationToken({
    _userId: existingUser._id,
    token: resetToken,
    createdAt: Date.now(),
  }).save();

  if (existingUser && existingUser.isEmailVerified) {
    const emailLink = `${domainURL}/auth/reset_password?emailToken=${newVerificationToken.token}&userId=${existingUser._id}`;

    const payload = {
      name: existingUser.firstName,
      link: emailLink,
    };

    await sendEmail(
      existingUser.email,
      "Password Reset Request",
      payload,
      "./templates/email/requestResetPassword.handlebars"
    );

    res.status(200).json({
      success: true,
      message: `Hey ${existingUser.firstName}, an email has been sent to your account with the password reset link`,
    });
  }
});

// $-title   Reset User Password
// $-path    POST /api/v1/auth/reset_password
// $-auth    Public

const resetPassword = asyncHandler(async (req, res) => {
  const { password, passwordConfirm, userId, emailToken } = req.body;

  if (!password) throw400Error(res, "A password is required");
  if (!passwordConfirm)
    throw400Error(res, "A confirm password field is required");
  if (password !== passwordConfirm)
    throw400Error(res, "Passwords do not match");
  if (password.length < 8)
    throw400Error(res, "Passwords must be at least 8 characters long");

  const passwordResetToken = await VerificationToken.findOne({
    _userId: userId,
  });

  if (!passwordResetToken)
    throw400Error(
      res,
      "Your token is either invalid or expired. Try resetting your password again"
    );

  const user = await User.findById({
    _id: passwordResetToken._userId,
  }).select("-passwordConfirm");

  if (user && passwordResetToken) {
    user.password = password;
    await user.save();

    const payload = {
      name: user.firstName,
    };

    await sendEmail(
      user.email,
      "Password Reset Success",
      payload,
      "./templates/email/resetPassword.handlebars"
    );

    res.json({
      success: true,
      message: `Hey ${user.firstName}, Your password reset was successful. An email has been sent to confirm the same`,
    });
  }
});

export { resetPasswordRequest, resetPassword };

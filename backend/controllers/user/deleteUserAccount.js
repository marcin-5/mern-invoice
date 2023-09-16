import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import { throw400Error } from "../../utils/throwError.js";

// $-title   Delete User Account
// $-path    DELETE /api/v1/user/:id
// $-auth    Private/Admin
// an admin user can delete any other user account
const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    const result = await user.deleteOne();

    res.json({
      success: true,
      message: `User ${result.firstName} deleted successfully`,
    });
  } else throw400Error(res, "user not found");
});

export default deleteUserAccount;

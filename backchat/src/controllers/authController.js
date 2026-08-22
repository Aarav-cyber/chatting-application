const {
  authenticateWithGoogle,
} = require("../services/authService");

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const result = await authenticateWithGoogle(
      credential
    );

    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error(
      "Google authentication error:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
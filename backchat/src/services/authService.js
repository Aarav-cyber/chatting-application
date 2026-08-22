const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const authenticateWithGoogle = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const {
    sub: googleId,
    email,
    name,
    picture,
  } = payload;

  if (!googleId || !email || !name) {
    throw new Error("Incomplete Google account information");
  }

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.create({
      googleId,
      name,
      email,
      profilePic: picture,
    });
  } else {
    user.name = name;
    user.email = email;
    user.profilePic = picture;

    await user.save();
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    user,
  };
};

module.exports = {
  authenticateWithGoogle,
};
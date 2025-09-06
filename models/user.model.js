import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    profilePic: {
      type: String,
      default:
        "https://res.cloudinary.com/your-cloud/image/upload/v123456789/default_profile.jpg",
    },
    skills: [
      {
        type: String,
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
  },
  { timestamps: true }
);

// ✅ Indexes
// Email & googleId already have unique indexes because of `unique:true`
// Additional useful indexes:
userSchema.index({ role: 1 });          // queries by role faster
userSchema.index({ skills: 1 });        // queries by skills faster
userSchema.index({ fullName: "text" }); // enable text search on name if needed

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

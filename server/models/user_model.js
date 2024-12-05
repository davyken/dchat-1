import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: function() {
                // Username is required only if there's no Google auth
                return !this.googleId;
            },
            unique: true,
            sparse: true, // Allows null/undefined while maintaining uniqueness
        },
        password: {
            type: String,
            required: function() {
                // Password is required only if there's no Google auth
                return !this.googleId;
            },
            minlength: 6,
        },
        gender: {
            type: String,
            required: true,
            enum: ["male", "female", "not_specified"], 
            default: "not_specified"
        },
        profilePic: {
            type: String,
            default: "",
        },
        // Google Authentication fields
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allows null/undefined while maintaining uniqueness
        },
        email: {
            type: String,
            unique: true,
            sparse: true, // Allows null/undefined while maintaining uniqueness
            lowercase: true,
        },
        // Password reset fields
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        // Track authentication method
        authMethod: {
            type: String,
            enum: ["local", "google"],
            required: true,
            default: "local"
        }
    },
    { timestamps: true }
);

// Pre-save middleware to ensure either password/username or googleId exists
userSchema.pre('save', function(next) {
    if (!this.isModified('googleId') && !this.isModified('password')) {
        return next();
    }

    if (this.googleId) {
        this.authMethod = 'google';
        // For Google users, generate a unique username if not provided
        if (!this.username) {
            this.username = `user_${this._id.toString().slice(-6)}`;
        }
    } else {
        this.authMethod = 'local';
        // For local users, ensure password and username exist
        if (!this.password || !this.username) {
            return next(new Error('Password and username are required for local authentication'));
        }
    }
    next();
});

// Method to safely return user data (excluding sensitive information)
userSchema.methods.toSafeObject = function() {
    return {
        _id: this._id,
        fullName: this.fullName,
        username: this.username,
        gender: this.gender,
        profilePic: this.profilePic,
        email: this.email,
        authMethod: this.authMethod,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to find or create a Google user
userSchema.statics.findOrCreateGoogleUser = async function(googleData) {
    try {
        // Try to find user by googleId first
        let user = await this.findOne({ googleId: googleData.googleId });
        
        // If no user found, try by email
        if (!user && googleData.email) {
            user = await this.findOne({ email: googleData.email });
        }

        // If still no user, create new one
        if (!user) {
            user = await this.create({
                googleId: googleData.googleId,
                email: googleData.email,
                fullName: googleData.fullName,
                profilePic: googleData.profilePic || "",
                authMethod: "google",
                gender: "not_specified" // Default for new Google users
            });
        } else if (!user.googleId) {
            // If user exists but doesn't have googleId (email match), link accounts
            user.googleId = googleData.googleId;
            user.authMethod = "google";
            await user.save();
        }

        return user;
    } catch (error) {
        throw new Error('Error creating/finding Google user: ' + error.message);
    }
};

const User = mongoose.model("User", userSchema);

export default User;
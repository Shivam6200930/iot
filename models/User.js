const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ✅ Basic User Info
  firstName: { type: String, required: false },  
  lastName: { type: String, required: false }, 
  email: { type: String, unique: true, required: false },
  phone: { type: String,unique:true,required: false },  
  password: { type: String, required: false },  
  googleId: { type: String, required: false },  

  // ✅ Address Info
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zip: { type: String, required: false },
    country: { type: String, required: false }
  },

  // ✅ IoT Device States
  devices: [
    {
      name: { type: String, required: true },     
      type: { type: String, required: true },     
      state: { type: String, enum: ['ON', 'OFF'], default: 'OFF' }
    }
  ],

  // ✅ LED State
  ledState: { type: String, default: 'OFF' },

  // ✅ Role for Admin and User Differentiation
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // ✅ Preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true }
  },

  // ✅ Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Auto-update `updatedAt` field before saving
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);

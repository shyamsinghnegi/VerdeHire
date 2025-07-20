// server/controllers/authController.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EmployeeUser = require('../models/EmployeeUser'); // Ensure correct path and casing
const EmployerUser = require('../models/EmployerUser'); // Ensure correct path and casing

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register a new employee user
// @route   POST /api/auth/register-employee
// @access  Public
const registerEmployee = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  const employeeExists = await EmployeeUser.findOne({ email });
  const employerExists = await EmployerUser.findOne({ email });

  if (employeeExists || employerExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const employeeUser = await EmployeeUser.create({
    name,
    email,
    password: hashedPassword,
    role: 'employee', // Ensure role is explicitly set on creation
  });

  if (employeeUser) {
    console.log('Employee user successfully created:', employeeUser._id, employeeUser.email);
    res.status(201).json({
      _id: employeeUser._id,
      name: employeeUser.name,
      email: employeeUser.email,
      role: 'employee', // Return role here
      token: generateToken(employeeUser._id, 'employee'),
    });
  } else {
    console.error('Failed to create employee user:', req.body);
    res.status(400);
    throw new Error('Invalid employee user data');
  }
});

// @desc    Register a new employer user
// @route   POST /api/auth/register-employer
// @access  Public
const registerEmployer = asyncHandler(async (req, res) => {
  const { companyName, email, password, contactPerson } = req.body;

  if (!companyName || !email || !password || !contactPerson) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  const employeeExists = await EmployeeUser.findOne({ email });
  const employerExists = await EmployerUser.findOne({ email });

  if (employeeExists || employerExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const employerUser = await EmployerUser.create({
    companyName,
    email,
    password: hashedPassword,
    contactPerson,
    role: 'employer', // Ensure role is explicitly set on creation
  });

  if (employerUser) {
    console.log('Employer user successfully created:', employerUser._id, employerUser.email);
    res.status(201).json({
      _id: employerUser._id,
      companyName: employerUser.companyName,
      email: employerUser.email,
      contactPerson: employerUser.contactPerson,
      role: 'employer', // Return role here
      token: generateToken(employerUser._id, 'employer'),
    });
  } else {
    console.error('Failed to create employer user:', req.body);
    res.status(400);
    throw new Error('Invalid employer user data');
  }
});

// @desc    Authenticate a user (login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    res.status(400);
    throw new Error('Please enter all fields (email, password, and role)');
  }

  let user = null;
  let userRole = null;

  if (role === 'employee') {
    user = await EmployeeUser.findOne({ email });
    userRole = 'employee';
  } else if (role === 'employer') {
    user = await EmployerUser.findOne({ email });
    userRole = 'employer';
  } else {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    console.log(`User logged in: ${user.email} as ${userRole}`);
    res.json({
      _id: user._id,
      name: user.name || user.companyName, // Return appropriate name based on role
      email: user.email,
      role: userRole, // Return role here
      token: generateToken(user._id, userRole),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (protected by authMiddleware)
const getProfile = asyncHandler(async (req, res) => {
  const { _id, role } = req.user; // _id and role from protect middleware

  console.log(`[GET PROFILE Controller] Attempting to get profile for ID: ${_id} with role: ${role}`);

  let userProfile = null;
  if (role === 'employee') {
    userProfile = await EmployeeUser.findById(_id).select('-password');
    console.log(`[GET PROFILE Controller] Querying EmployeeUser for ID: ${_id}. Result:`, userProfile ? 'Found' : 'Not Found');
  } else if (role === 'employer') {
    userProfile = await EmployerUser.findById(_id).select('-password');
    console.log(`[GET PROFILE Controller] Querying EmployerUser for ID: ${_id}. Result:`, userProfile ? 'Found' : 'Not Found');
  } else {
    console.log(`[GET PROFILE Controller] Invalid role received from token (unexpected in controller): ${role}`);
    res.status(400);
    throw new Error('Invalid role specified in token');
  }

  if (userProfile) {
    console.log(`[GET PROFILE Controller] Profile successfully found for user ID: ${userProfile._id}`);
    // Explicitly include all fields your frontend expects, especially 'role'
    res.json({
      _id: userProfile._id,
      name: userProfile.name || userProfile.companyName, // Handle name for both types
      email: userProfile.email,
      role: userProfile.role, // <--- CRITICAL: ENSURE ROLE IS INCLUDED HERE
      headline: userProfile.headline || '',
      contactPhone: userProfile.contactPhone || '',
      linkedinProfile: userProfile.linkedinProfile || '',
      githubProfile: userProfile.githubProfile || '',
      location: userProfile.location || '',
      // Add other fields that might be specific to employer if applicable
      companyName: userProfile.companyName || '',
      contactPerson: userProfile.contactPerson || '',
      industry: userProfile.industry || '',
      companyWebsite: userProfile.companyWebsite || '',
      companyDescription: userProfile.companyDescription || '',
      // Add any other fields from your User/Employee/Employer models that frontend needs
      resumes: userProfile.resumes || [], // Assuming these are arrays
      jobDescriptions: userProfile.jobDescriptions || [],
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    });
  } else {
    console.log(`[GET PROFILE Controller] No profile found for ID: ${_id} in ${role} collection. Throwing error.`);
    res.status(404);
    throw new Error('User profile not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (protected by authMiddleware)
const updateProfile = asyncHandler(async (req, res) => {
  const { _id, role } = req.user;
  console.log(`[UPDATE PROFILE Controller] Attempting to update profile for ID: ${_id} with role: ${role}`);

  let userModel = null;
  let updateFields = {};

  if (role === 'employee') {
    userModel = EmployeeUser;
    const { name, email, headline, contactPhone, linkedinProfile, githubProfile, location } = req.body;
    updateFields = { name, email, headline, contactPhone, linkedinProfile, githubProfile, location };
    // Filter out undefined values to prevent overwriting existing data with undefined
    updateFields = Object.fromEntries(Object.entries(updateFields).filter(([_, v]) => v !== undefined));
    console.log(`[UPDATE PROFILE Controller] Preparing update for EmployeeUser. Fields:`, updateFields);
  } else if (role === 'employer') {
    userModel = EmployerUser;
    const { companyName, email, contactPerson, industry, companyWebsite, companyDescription } = req.body;
    updateFields = { companyName, email, contactPerson, industry, companyWebsite, companyDescription };
    // Filter out undefined values
    updateFields = Object.fromEntries(Object.entries(updateFields).filter(([_, v]) => v !== undefined));
    console.log(`[UPDATE PROFILE Controller] Preparing update for EmployerUser. Fields:`, updateFields);
  } else {
    console.log(`[UPDATE PROFILE Controller] Invalid role received for update: ${role}`);
    res.status(400);
    throw new Error('Invalid role for profile update');
  }

  // Check if updateFields is empty (no valid fields to update)
  if (Object.keys(updateFields).length === 0) {
      res.status(400);
      throw new Error('No valid fields provided for update.');
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    _id,
    { $set: updateFields },
    { new: true, runValidators: true, select: '-password' } // Return new doc, run schema validators, exclude password
  );

  if (!updatedUser) {
    console.log(`[UPDATE PROFILE Controller] User with ID: ${_id} not found for update in ${role} collection.`);
    res.status(404);
    throw new new Error('User profile not found for update');
  }

  console.log(`[UPDATE PROFILE Controller] Profile successfully updated for user ID: ${updatedUser._id}`);
  // Return the full updated user object, including role
  res.json({
    message: 'Profile updated successfully',
    user: {
      _id: updatedUser._id,
      name: updatedUser.name || updatedUser.companyName,
      email: updatedUser.email,
      role: updatedUser.role, // <--- CRITICAL: ENSURE ROLE IS INCLUDED HERE
      headline: updatedUser.headline || '',
      contactPhone: updatedUser.contactPhone || '',
      linkedinProfile: updatedUser.linkedinProfile || '',
      githubProfile: updatedUser.githubProfile || '',
      location: updatedUser.location || '',
      companyName: updatedUser.companyName || '',
      contactPerson: updatedUser.contactPerson || '',
      industry: updatedUser.industry || '',
      companyWebsite: updatedUser.companyWebsite || '',
      companyDescription: updatedUser.companyDescription || '',
      resumes: updatedUser.resumes || [],
      jobDescriptions: updatedUser.jobDescriptions || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    }
  });
});


module.exports = {
  registerEmployee,
  registerEmployer,
  loginUser,
  getProfile,
  updateProfile,
};
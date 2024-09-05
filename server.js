const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// In-memory "database" for users and courses
let users = [];
let courses = [
  { id: 1, title: 'Web desing', description: 'HTML CSS JAVASCRIPT' },
  { id: 2, title: 'Graphic desing', description: 'BASIC GRAPHIC' },
  { id: 3, title: 'Figma', description: 'START ON FIGMA' },
];

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.get('/', (req, res) => res.render('index'));

// Register Route
app.get('/register', (req, res) => res.render('register'));

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.flash('error_msg', 'Please fill in all fields');
    return res.redirect('/register');
  }

  const userExists = users.find(user => user.email === email);
  if (userExists) {
    req.flash('error_msg', 'Email is already registered');
    return res.redirect('/register');
  }

  const newUser = { id: users.length + 1, name, email, password, enrolledCourses: [] };
  users.push(newUser);
  req.flash('success_msg', 'You are registered and can log in');
  res.redirect('/login');
});

// Login Route
app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    req.flash('error_msg', 'Invalid credentials');
    return res.redirect('/login');
  }

  req.session.user = user;
  req.flash('success_msg', 'You are logged in');
  res.redirect('/profile');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

// Courses Route
app.get('/courses', (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to view courses');
    return res.redirect('/login');
  }
  res.render('courses', { courses });
});

// Enroll in a Course
app.post('/courses/enroll/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = courses.find(c => c.id === courseId);
  
  if (course && !req.session.user.enrolledCourses.includes(course.title)) {
    req.session.user.enrolledCourses.push(course.title);
    req.flash('success_msg', `You have enrolled in ${course.title}`);
  } else {
    req.flash('error_msg', 'Course not found or already enrolled');
  }

  res.redirect('/courses');
});

// Profile Route
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to view your profile');
    return res.redirect('/login');
  }
  res.render('profile', { user: req.session.user });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

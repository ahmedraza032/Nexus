require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Meeting = mongoose.model('Meeting', new mongoose.Schema({
    organizer: mongoose.Schema.Types.ObjectId,
    attendee: mongoose.Schema.Types.ObjectId,
    status: String,
    startTime: Date,
    endTime: Date,
    title: String,
  }, { strict: false }));
  
  const User = mongoose.model('User', new mongoose.Schema({
    name: String, role: String, profileViews: Number, upcomingMeetings: Number, email: String,
  }, { strict: false }));

  const meetings = await Meeting.find({}).lean();
  console.log('All meetings:', JSON.stringify(meetings, null, 2));

  const users = await User.find({}).select('name email profileViews upcomingMeetings _id').lean();
  console.log('Users:', JSON.stringify(users, null, 2));
  
  process.exit(0);
}
check();

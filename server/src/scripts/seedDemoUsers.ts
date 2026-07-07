import { User, Entrepreneur, Investor } from '../models/User';

export const seedDemoUsers = async () => {
  try {
    // Check if entrepreneur exists
    const entrepreneurEmail = 'sarah@techwave.io';
    const existingEntrepreneur = await User.findOne({ email: entrepreneurEmail });
    
    if (!existingEntrepreneur) {
      const entrepreneur = new Entrepreneur({
        name: 'Sarah Johnson',
        email: entrepreneurEmail,
        password: 'password123',
        role: 'entrepreneur',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'Passionate about building AI-driven solutions for real-world problems. 10+ years in software engineering.',
        startupName: 'TechWave AI',
        pitchSummary: 'We are building an autonomous AI platform that streamlines cloud infrastructure management.',
        fundingNeeded: '$1.5M',
        industry: 'Artificial Intelligence',
        location: 'San Francisco, CA',
        foundedYear: 2023,
        teamSize: 5,
        profileViews: 120,
        upcomingMeetings: 3,
        notifications: [
          {
            type: 'message',
            user: {
              name: 'Michael Chen',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
            },
            content: 'sent you a message about your startup',
            time: '5 minutes ago',
            unread: true
          }
        ]
      });
      await entrepreneur.save();
      console.log('Demo entrepreneur created');
    }

    // Check if investor exists
    const investorEmail = 'michael@vcinnovate.com';
    const existingInvestor = await User.findOne({ email: investorEmail });
    
    if (!existingInvestor) {
      const investor = new Investor({
        name: 'Michael Chen',
        email: investorEmail,
        password: 'password123',
        role: 'investor',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        bio: 'Managing Partner at VC Innovate. I focus on early-stage AI and SaaS startups.',
        investmentInterests: ['Artificial Intelligence', 'SaaS', 'Fintech'],
        investmentStage: ['Seed', 'Series A'],
        portfolioCompanies: ['CloudNative', 'DataFlow', 'FinSecure'],
        totalInvestments: 12,
        minimumInvestment: '$100k',
        maximumInvestment: '$2M',
        profileViews: 85,
        upcomingMeetings: 2,
        notifications: []
      });
      await investor.save();
      console.log('Demo investor created');
    }
  } catch (error) {
    console.error('Error seeding demo users:', error);
  }
};

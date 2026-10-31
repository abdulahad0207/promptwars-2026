import { CampusEvent } from '@/types';

/**
 * Generates sample campus events dynamically anchored to a reference date
 * so that "Needs Attention Today", "Urgent", "Upcoming", and "Expired" categories
 * have real items to immediately demonstrate functionality.
 */
export function generateDefaultEvents(baseDate: Date = new Date()): CampusEvent[] {
  const formatDate = (daysOffset: number): string => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(0);
  const tomorrowStr = formatDate(1);
  const inTwoDaysStr = formatDate(2);
  const inFourDaysStr = formatDate(4);
  const inSevenDaysStr = formatDate(7);
  const yesterdayStr = formatDate(-1);

  return [
    {
      id: 'evt-sample-1',
      title: 'Cloud Computing Lab Manual Submission',
      date: todayStr,
      time: '4:30 PM',
      venue: 'Lab 4, Block B (CSE Wing)',
      category: 'academic',
      summary: 'Strict deadline: submit signed physical lab manuals to Prof. Ramesh. 20% mark deduction for late entries.',
      actionItem: 'Get manual signed by peer reviewer before 4:00 PM.',
      tags: ['academic', 'deadline', 'cse'],
      rawText: '🚨 URGENT NOTICE: Submit Cloud Computing Lab records TODAY by 4:30 PM sharp in Lab 4 Block B! Late entries lose 20% marks!',
      createdAt: new Date(baseDate.getTime() - 86400000 * 2).toISOString(),
      isPinned: true,
    },
    {
      id: 'evt-sample-2',
      title: 'ACM 24-Hour HackSprint Registration Deadline',
      date: tomorrowStr,
      time: '11:59 PM',
      venue: 'Innovation Garage & Main Audi 3',
      category: 'club',
      summary: '24-hour hackathon with cash prizes, free food, and mentor office hours. Teams of 2 to 4.',
      actionItem: 'Finalize team roster and submit GitHub repo link.',
      tags: ['hackathon', 'coding', 'acm', 'pizza'],
      rawText: 'Hey guys! ACM HackSprint 2026 closes tomorrow night 11:59pm! Audi 3. Free pizza and RedBull provided! Register team now.',
      createdAt: new Date(baseDate.getTime() - 86400000).toISOString(),
    },
    {
      id: 'evt-sample-3',
      title: 'Annual Campus Career Fair & Resume Drop',
      date: inTwoDaysStr,
      time: '10:00 AM - 4:00 PM',
      venue: 'Student Recreation Complex Hall A',
      category: 'workshop',
      summary: 'Over 40 tech and consulting companies hiring for summer internships and full-time roles.',
      actionItem: 'Print 15 hard copies of your resume; formal attire required.',
      tags: ['careers', 'internships', 'jobs'],
      rawText: 'Campus Career Fair is coming up in 2 days from 10am to 4pm at Student Recreation Complex Hall A. Bring printed resumes.',
      createdAt: new Date(baseDate.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: 'evt-sample-4',
      title: 'Inter-College Basketball Tournament Trials',
      date: inFourDaysStr,
      time: '5:30 PM',
      venue: 'Outdoor Sports Complex, Court 2',
      category: 'sports',
      summary: 'Open selection trials for university varsity basketball squad. Both men and women divisions.',
      actionItem: 'Bring non-marking court shoes and student health clearance form.',
      tags: ['sports', 'basketball', 'trials'],
      rawText: 'Varsity Basketball trials in 4 days at 5:30pm Outdoor Sports Complex Court 2. Wear court shoes.',
      createdAt: new Date(baseDate.getTime() - 86400000 * 4).toISOString(),
    },
    {
      id: 'evt-sample-5',
      title: 'Cultural Fest "Euphoria 2026" Battle of the Bands',
      date: inSevenDaysStr,
      time: '6:30 PM - 10:00 PM',
      venue: 'Open Air Amphitheatre',
      category: 'social',
      summary: 'Live performances from 8 student finalist bands. Food trucks, merch stalls, and acoustic jam.',
      actionItem: 'Reserve your free student wristband online.',
      tags: ['music', 'fest', 'social'],
      rawText: 'Euphoria Fest Battle of the Bands next week! Open Air Amphitheatre at 6:30pm. Grab your entry passes.',
      createdAt: new Date(baseDate.getTime() - 86400000 * 5).toISOString(),
    },
    {
      id: 'evt-sample-6',
      title: 'Library Overdue Book Amnesty & Clearance',
      date: yesterdayStr,
      time: '5:00 PM',
      venue: 'Central Library Circulation Desk',
      category: 'administrative',
      summary: 'Last day to return all semester reserve books without incurring overdue penalty charges.',
      actionItem: 'Clear remaining library ledger balance.',
      tags: ['library', 'books', 'admin'],
      rawText: 'Notice: Library Amnesty period ended yesterday 5pm at Central Library circulation desk.',
      createdAt: new Date(baseDate.getTime() - 86400000 * 6).toISOString(),
    },
  ];
}

export interface SampleTemplate {
  label: string;
  categoryHint: string;
  iconName: string;
  text: string;
}

export const SAMPLE_PASTE_TEMPLATES: SampleTemplate[] = [
  {
    label: '🚨 WhatsApp: Urgent Lab Submission',
    categoryHint: 'Academic Deadline',
    iconName: 'AlertCircle',
    text: `🚨🚨 *URGENT NOTICE FOR ALL 3RD YEAR CS STUDENTS* 🚨🚨
Fwd from HOD Office:
The deadline for submitting the Cloud Computing Lab Records has been moved to TODAY by 4:30 PM sharp! ⏰
Bring your signed manual and physical files to Lab 4, Block B.
Anyone submitting after 4:30 PM will lose 20% internal marks!
Dr. Ramesh K., Dept of CSE.`,
  },
  {
    label: '🍕 Group Chat: Hackathon & Pizza Party',
    categoryHint: 'Club & Coding',
    iconName: 'Code',
    text: `Yo folks!! 🚀🔥 ACM HackSprint 2026 registrations are closing tomorrow at 11:59 PM!!
Venue: Innovation Garage & Main Audi 3
Time: 10:00 AM onwards (24 hr hack)
Free RedBull + Dominos Pizza for all registered teams! Teams of 2-4.
Fill this form ASAP: bit.ly/acm-hacksprint-26
Bring laptops, chargers and your student ID! Don't miss it!! 🍕✨`,
  },
  {
    label: '📧 Email: Midterm Rescheduled from Prof',
    categoryHint: 'Academic / Exam',
    iconName: 'GraduationCap',
    text: `From: Prof. Aris Thorne <a.thorne@university.edu>
Subject: PHYS 201 Midterm Reschedule & Hall Ticket Announcement
Date: Fri, Oct 30, 2026

Dear Students,
Please note that due to university senate meetings, the Physics 201 Midterm is rescheduled to Friday, Nov 6 at 09:30 AM in Examination Hall C.
The revised syllabus covers Chapters 4 through 8. Scientific non-programmable calculators are allowed. Please ensure you carry your physical University ID Card.
Late entry beyond 09:45 AM will strictly not be permitted.
Best regards,
Prof. Thorne`,
  },
  {
    label: '🏀 Sports: Varsity Basketball Trials',
    categoryHint: 'Sports & Athletics',
    iconName: 'Trophy',
    text: `🏀🏀 INTER-COLLEGE BASKETBALL TRYOUTS & TRIALS!
Date: Nov 8, 2026
Timings: 5:00 PM to 7:30 PM
Venue: Outdoor Sports Complex, Court 2
Open for both Men and Women college teams. Bring proper non-marking court shoes and hydration bottles.
Contact: Sports Sec Rohit (9876543210)`,
  },
  {
    label: '📢 Admin: Library 24x7 Exam Pass',
    categoryHint: 'Administrative Notice',
    iconName: 'Building',
    text: `CIRCULAR: Night Study Hall & Library Access during Exam Week
Central Library Ground Floor Study Hall will remain open 24x7 from Nov 2 to Nov 20, 2026.
Students must display digital ID on Campus App at the turnstile gate.
Coffee and tea vending available in the foyer from 11:00 PM to 5:00 AM. Quiet hours enforced after 10 PM.`,
  },
];

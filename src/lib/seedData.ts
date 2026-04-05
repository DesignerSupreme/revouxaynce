import { uid } from "./helpers";
import type { Event, Client, Vendor, Invoice, Guest, Expense, TeamMember } from "@/types";

export const seedEvents = (): Event[] => [
  { id: uid(), name: "The Moyo Gala", date: "2026-06-14", time: "18:00", venue: "Rainbow Towers, Harare", clientId: "", status: "Confirmed", notes: "Black-tie, 200 guests" },
  { id: uid(), name: "Noir Fashion Show", date: "2026-07-22", time: "20:00", venue: "Meikles Hotel Rooftop", clientId: "", status: "Planning", notes: "Runway + after-party" },
  { id: uid(), name: "Chigumba Wedding", date: "2026-08-30", time: "16:00", venue: "Bvumba Botanical Gardens", clientId: "", status: "Planning", notes: "Intimate ceremony, 80 guests" },
  { id: uid(), name: "Annual Charity Auction", date: "2026-05-10", time: "19:00", venue: "Borrowdale Brooke, Harare", clientId: "", status: "Wrapped", notes: "Raised $450k" },
  { id: uid(), name: "Ndlovu Product Launch", date: "2026-09-05", time: "14:00", venue: "HICC, Harare", clientId: "", status: "Planning", notes: "Tech product reveal, 300 attendees" },
  { id: uid(), name: "Lancaster Anniversary", date: "2026-10-18", time: "17:00", venue: "Victoria Falls Hotel", clientId: "", status: "Confirmed", notes: "25th anniversary celebration" },
  { id: uid(), name: "Garwe Birthday Soirée", date: "2026-11-02", time: "19:30", venue: "The Venue, Borrowdale", clientId: "", status: "Planning", notes: "40th birthday, cocktail party" },
  { id: uid(), name: "Corporate Retreat 2026", date: "2026-12-08", time: "08:00", venue: "Troutbeck Resort, Nyanga", clientId: "", status: "Confirmed", notes: "3-day team building, 50 pax" },
];

export const seedClients = (): Client[] => [
  { id: uid(), name: "Tariro Moyo", email: "tariro@moyo.co.zw", phone: "+263 77 200 1001", eventType: "Gala", status: "Confirmed", notes: [{ text: "Prefers monochrome florals", date: "2026-04-01" }] },
  { id: uid(), name: "James Whitmore", email: "james@whitmore.co.uk", phone: "+44 7700 900202", eventType: "Wedding", status: "Quoted", notes: [] },
  { id: uid(), name: "Rutendo Chigumba", email: "rutendo@chigumba.co.zw", phone: "+263 71 300 0303", eventType: "Corporate", status: "Inquiry", notes: [] },
  { id: uid(), name: "Tendai Ndlovu", email: "tendai@ndlovu.co.zw", phone: "+263 77 400 5050", eventType: "Product Launch", status: "Confirmed", notes: [{ text: "Wants tech-forward staging", date: "2026-03-20" }] },
  { id: uid(), name: "Sophie Lancaster", email: "sophie@lancaster.co.uk", phone: "+44 7911 223344", eventType: "Anniversary", status: "Confirmed", notes: [{ text: "Gold and ivory palette", date: "2026-03-15" }] },
  { id: uid(), name: "Nyasha Garwe", email: "nyasha@garwe.co.zw", phone: "+263 78 600 7070", eventType: "Birthday", status: "Quoted", notes: [] },
];

export const seedVendors = (): Vendor[] => [
  { id: uid(), name: "Ruva Florals", category: "Florals", contact: "hello@ruvaflorals.co.zw", rating: 5, notes: "Premium installations", eventIds: [] },
  { id: uid(), name: "Kudza Catering", category: "Catering", contact: "book@kudzacatering.co.zw", rating: 4, notes: "Pan-African cuisine specialist", eventIds: [] },
  { id: uid(), name: "Lux AV Systems", category: "AV", contact: "info@luxav.com", rating: 4, notes: "Full production capability", eventIds: [] },
  { id: uid(), name: "Capture Studio", category: "Photography", contact: "hi@capturestudio.co.zw", rating: 5, notes: "Editorial style", eventIds: [] },
  { id: uid(), name: "Makanaka Décor", category: "Decor", contact: "design@makanaka.co.zw", rating: 5, notes: "Bespoke installations", eventIds: [] },
  { id: uid(), name: "ZimTransit Luxury", category: "Transport", contact: "fleet@zimtransit.co.zw", rating: 4, notes: "Premium vehicle fleet", eventIds: [] },
  { id: uid(), name: "BeatMasters DJs", category: "Entertainment", contact: "play@beatmasters.co.zw", rating: 3, notes: "DJ + live band", eventIds: [] },
  { id: uid(), name: "Oliver Bennett Catering", category: "Catering", contact: "oliver@bennettcatering.co.uk", rating: 5, notes: "Fine dining specialist", eventIds: [] },
];

export const seedInvoices = (): Invoice[] => [
  { id: uid(), clientId: "", eventId: "", amount: 45000, status: "Sent", dueDate: "2026-05-01", notes: "", lineItems: [{ desc: "Event planning fee", amount: 25000 }, { desc: "Vendor coordination", amount: 20000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 12000, status: "Paid", dueDate: "2026-04-15", notes: "", lineItems: [{ desc: "Consultation package", amount: 12000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 8500, status: "Draft", dueDate: "2026-06-01", notes: "", lineItems: [{ desc: "Day-of coordination", amount: 8500 }] },
  { id: uid(), clientId: "", eventId: "", amount: 3200, status: "Overdue", dueDate: "2026-03-15", notes: "Follow up needed", lineItems: [{ desc: "Venue scouting", amount: 3200 }] },
  { id: uid(), clientId: "", eventId: "", amount: 28000, status: "Paid", dueDate: "2026-02-20", notes: "", lineItems: [{ desc: "Full event management", amount: 20000 }, { desc: "Design & decor", amount: 8000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 15000, status: "Sent", dueDate: "2026-07-01", notes: "", lineItems: [{ desc: "Anniversary planning", amount: 15000 }] },
  { id: uid(), clientId: "", eventId: "", amount: 6500, status: "Paid", dueDate: "2026-03-01", notes: "", lineItems: [{ desc: "Consultation & concept", amount: 6500 }] },
  { id: uid(), clientId: "", eventId: "", amount: 22000, status: "Draft", dueDate: "2026-08-15", notes: "", lineItems: [{ desc: "Retreat coordination", amount: 15000 }, { desc: "Activities planning", amount: 7000 }] },
];

export const seedGuests = (): Guest[] => [
  { id: uid(), name: "Tatenda Mapfumo", eventId: "", email: "tatenda@mapfumo.co.zw", phone: "+263 77 400 1001", rsvp: "Attending", dietary: "Vegetarian", tableGroup: "Table 1" },
  { id: uid(), name: "Emily Harlow", eventId: "", email: "emily@harlow.co.uk", phone: "+44 7700 901002", rsvp: "Pending", dietary: "", tableGroup: "Table 2" },
  { id: uid(), name: "Ruvimbo Nyathi", eventId: "", email: "ruvimbo@nyathi.co.zw", phone: "+263 71 500 1003", rsvp: "Attending", dietary: "Gluten-free", tableGroup: "Table 1" },
  { id: uid(), name: "David Thompson", eventId: "", email: "david@thompson.co.uk", phone: "+44 7911 123456", rsvp: "Declined", dietary: "", tableGroup: "" },
  { id: uid(), name: "Farai Mukombe", eventId: "", email: "farai@mukombe.co.zw", phone: "+263 77 800 2200", rsvp: "Attending", dietary: "Halal", tableGroup: "Table 3" },
  { id: uid(), name: "Grace Mutasa", eventId: "", email: "grace@mutasa.co.zw", phone: "+263 71 900 3300", rsvp: "Attending", dietary: "", tableGroup: "Table 2" },
  { id: uid(), name: "Oliver Bennett", eventId: "", email: "oliver@bennett.co.uk", phone: "+44 7911 445566", rsvp: "Pending", dietary: "Vegan", tableGroup: "Table 4" },
  { id: uid(), name: "Chenai Dube", eventId: "", email: "chenai@dube.co.zw", phone: "+263 78 100 4400", rsvp: "Attending", dietary: "", tableGroup: "Table 1" },
  { id: uid(), name: "Rumbidzai Pfende", eventId: "", email: "rumbi@pfende.co.zw", phone: "+263 77 200 5500", rsvp: "Declined", dietary: "Vegetarian", tableGroup: "" },
  { id: uid(), name: "Charlotte Hughes", eventId: "", email: "charlotte@hughes.co.uk", phone: "+44 7700 667788", rsvp: "Attending", dietary: "", tableGroup: "Table 3" },
];

export const seedExpenses = (): Expense[] => [
  { id: uid(), date: "2026-04-02", vendor: "Ruva Florals", category: "Florals", amount: 3200, eventId: "", notes: "Centerpiece arrangements", receiptUrl: "" },
  { id: uid(), date: "2026-04-03", vendor: "Kudza Catering", category: "Catering", amount: 8500, eventId: "", notes: "Tasting session deposit", receiptUrl: "" },
  { id: uid(), date: "2026-03-28", vendor: "Harare Office Supplies", category: "Supplies", amount: 145.50, eventId: "", notes: "Printing & stationery", receiptUrl: "" },
  { id: uid(), date: "2026-03-15", vendor: "Lux AV Systems", category: "AV", amount: 4200, eventId: "", notes: "Sound system rental deposit", receiptUrl: "" },
  { id: uid(), date: "2026-03-20", vendor: "Makanaka Décor", category: "Decor", amount: 6800, eventId: "", notes: "Custom stage backdrop", receiptUrl: "" },
  { id: uid(), date: "2026-04-05", vendor: "ZimTransit Luxury", category: "Transport", amount: 1500, eventId: "", notes: "VIP shuttle service", receiptUrl: "" },
  { id: uid(), date: "2026-02-28", vendor: "Capture Studio", category: "Photography", amount: 3500, eventId: "", notes: "Event photography package", receiptUrl: "" },
  { id: uid(), date: "2026-04-01", vendor: "Oliver Bennett Catering", category: "Catering", amount: 12000, eventId: "", notes: "Full catering package", receiptUrl: "" },
  { id: uid(), date: "2026-03-10", vendor: "BeatMasters DJs", category: "Entertainment", amount: 2200, eventId: "", notes: "DJ set + equipment", receiptUrl: "" },
  { id: uid(), date: "2026-02-15", vendor: "Victoria Falls Hotel", category: "Venue", amount: 18000, eventId: "", notes: "Venue booking deposit", receiptUrl: "" },
];

export const seedTeam = (): TeamMember[] => [
  { id: uid(), name: "Chido Nyakanda", email: "nyakandachido@gmail.com", password: "m@n@n@5", role: "admin", access: ["dashboard","events","clients","vendors","finances","expenses","guests","team"] },
];

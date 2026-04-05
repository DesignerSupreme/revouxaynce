import type { Event, Client, Vendor, Invoice, Guest, Expense, TeamMember, Task } from "@/types";

// ─── Stable IDs ───────────────────────────────────────────────────
// Pre-generated so every entity can reference others reliably.

const CLIENT_IDS = {
  tariro:  "cl-tariro-001",
  james:   "cl-james-002",
  rutendo: "cl-rutendo-003",
  tendai:  "cl-tendai-004",
  sophie:  "cl-sophie-005",
  nyasha:  "cl-nyasha-006",
} as const;

const EVENT_IDS = {
  moyoGala:       "ev-moyo-gala-001",
  fashionShow:    "ev-fashion-show-002",
  chigumbaWed:    "ev-chigumba-wed-003",
  charityAuction: "ev-charity-auction-004",
  ndlovuLaunch:   "ev-ndlovu-launch-005",
  lancasterAnniv: "ev-lancaster-anniv-006",
  garweBirthday:  "ev-garwe-birthday-007",
  corpRetreat:    "ev-corp-retreat-008",
} as const;

const VENDOR_IDS = {
  ruvaFlorals:   "vn-ruva-001",
  kudzaCatering: "vn-kudza-002",
  luxAV:         "vn-luxav-003",
  captureStudio: "vn-capture-004",
  makanaka:      "vn-makanaka-005",
  zimTransit:    "vn-zimtransit-006",
  beatMasters:   "vn-beat-007",
  oliverBennett: "vn-oliver-008",
} as const;

const TEAM_IDS = {
  chido: "tm-chido-001",
} as const;

// ─── Seed Functions ───────────────────────────────────────────────

export const seedEvents = (): Event[] => [
  { id: EVENT_IDS.moyoGala, name: "The Moyo Gala", date: "2026-06-14", time: "18:00", venue: "Rainbow Towers, Harare", clientId: CLIENT_IDS.tariro, status: "Confirmed", notes: "Black-tie, 200 guests" },
  { id: EVENT_IDS.fashionShow, name: "Noir Fashion Show", date: "2026-07-22", time: "20:00", venue: "Meikles Hotel Rooftop", clientId: CLIENT_IDS.james, status: "Planning", notes: "Runway + after-party" },
  { id: EVENT_IDS.chigumbaWed, name: "Chigumba Wedding", date: "2026-08-30", time: "16:00", venue: "Bvumba Botanical Gardens", clientId: CLIENT_IDS.rutendo, status: "Planning", notes: "Intimate ceremony, 80 guests" },
  { id: EVENT_IDS.charityAuction, name: "Annual Charity Auction", date: "2026-05-10", time: "19:00", venue: "Borrowdale Brooke, Harare", clientId: CLIENT_IDS.tariro, status: "Wrapped", notes: "Raised $450k" },
  { id: EVENT_IDS.ndlovuLaunch, name: "Ndlovu Product Launch", date: "2026-09-05", time: "14:00", venue: "HICC, Harare", clientId: CLIENT_IDS.tendai, status: "Planning", notes: "Tech product reveal, 300 attendees" },
  { id: EVENT_IDS.lancasterAnniv, name: "Lancaster Anniversary", date: "2026-10-18", time: "17:00", venue: "Victoria Falls Hotel", clientId: CLIENT_IDS.sophie, status: "Confirmed", notes: "25th anniversary celebration" },
  { id: EVENT_IDS.garweBirthday, name: "Garwe Birthday Soirée", date: "2026-11-02", time: "19:30", venue: "The Venue, Borrowdale", clientId: CLIENT_IDS.nyasha, status: "Planning", notes: "40th birthday, cocktail party" },
  { id: EVENT_IDS.corpRetreat, name: "Corporate Retreat 2026", date: "2026-12-08", time: "08:00", venue: "Troutbeck Resort, Nyanga", clientId: CLIENT_IDS.rutendo, status: "Confirmed", notes: "3-day team building, 50 pax" },
];

export const seedClients = (): Client[] => [
  { id: CLIENT_IDS.tariro, name: "Tariro Moyo", email: "tariro@moyo.co.zw", phone: "+263 77 200 1001", eventType: "Gala", status: "Confirmed", notes: [{ text: "Prefers monochrome florals", date: "2026-04-01" }] },
  { id: CLIENT_IDS.james, name: "James Whitmore", email: "james@whitmore.co.uk", phone: "+44 7700 900202", eventType: "Wedding", status: "Quoted", notes: [] },
  { id: CLIENT_IDS.rutendo, name: "Rutendo Chigumba", email: "rutendo@chigumba.co.zw", phone: "+263 71 300 0303", eventType: "Corporate", status: "Inquiry", notes: [] },
  { id: CLIENT_IDS.tendai, name: "Tendai Ndlovu", email: "tendai@ndlovu.co.zw", phone: "+263 77 400 5050", eventType: "Product Launch", status: "Confirmed", notes: [{ text: "Wants tech-forward staging", date: "2026-03-20" }] },
  { id: CLIENT_IDS.sophie, name: "Sophie Lancaster", email: "sophie@lancaster.co.uk", phone: "+44 7911 223344", eventType: "Anniversary", status: "Confirmed", notes: [{ text: "Gold and ivory palette", date: "2026-03-15" }] },
  { id: CLIENT_IDS.nyasha, name: "Nyasha Garwe", email: "nyasha@garwe.co.zw", phone: "+263 78 600 7070", eventType: "Birthday", status: "Quoted", notes: [] },
];

export const seedVendors = (): Vendor[] => [
  { id: VENDOR_IDS.ruvaFlorals, name: "Ruva Florals", category: "Florals", contact: "hello@ruvaflorals.co.zw", rating: 5, notes: "Premium installations", eventIds: [EVENT_IDS.moyoGala, EVENT_IDS.lancasterAnniv, EVENT_IDS.garweBirthday] },
  { id: VENDOR_IDS.kudzaCatering, name: "Kudza Catering", category: "Catering", contact: "book@kudzacatering.co.zw", rating: 4, notes: "Pan-African cuisine specialist", eventIds: [EVENT_IDS.moyoGala, EVENT_IDS.charityAuction] },
  { id: VENDOR_IDS.luxAV, name: "Lux AV Systems", category: "AV", contact: "info@luxav.com", rating: 4, notes: "Full production capability", eventIds: [EVENT_IDS.fashionShow, EVENT_IDS.ndlovuLaunch] },
  { id: VENDOR_IDS.captureStudio, name: "Capture Studio", category: "Photography", contact: "hi@capturestudio.co.zw", rating: 5, notes: "Editorial style", eventIds: [EVENT_IDS.moyoGala, EVENT_IDS.chigumbaWed, EVENT_IDS.lancasterAnniv] },
  { id: VENDOR_IDS.makanaka, name: "Makanaka Décor", category: "Decor", contact: "design@makanaka.co.zw", rating: 5, notes: "Bespoke installations", eventIds: [EVENT_IDS.moyoGala, EVENT_IDS.fashionShow, EVENT_IDS.garweBirthday] },
  { id: VENDOR_IDS.zimTransit, name: "ZimTransit Luxury", category: "Transport", contact: "fleet@zimtransit.co.zw", rating: 4, notes: "Premium vehicle fleet", eventIds: [EVENT_IDS.lancasterAnniv, EVENT_IDS.corpRetreat] },
  { id: VENDOR_IDS.beatMasters, name: "BeatMasters DJs", category: "Entertainment", contact: "play@beatmasters.co.zw", rating: 3, notes: "DJ + live band", eventIds: [EVENT_IDS.garweBirthday, EVENT_IDS.fashionShow] },
  { id: VENDOR_IDS.oliverBennett, name: "Oliver Bennett Catering", category: "Catering", contact: "oliver@bennettcatering.co.uk", rating: 5, notes: "Fine dining specialist", eventIds: [EVENT_IDS.lancasterAnniv, EVENT_IDS.corpRetreat] },
];

export const seedInvoices = (): Invoice[] => [
  { id: "inv-001", clientId: CLIENT_IDS.tariro, eventId: EVENT_IDS.moyoGala, amount: 45000, status: "Sent", dueDate: "2026-05-01", notes: "", lineItems: [{ desc: "Event planning fee", qty: 1, unitPrice: 25000, amount: 25000 }, { desc: "Vendor coordination", qty: 1, unitPrice: 20000, amount: 20000 }] },
  { id: "inv-002", clientId: CLIENT_IDS.james, eventId: EVENT_IDS.fashionShow, amount: 12000, status: "Paid", dueDate: "2026-04-15", notes: "", lineItems: [{ desc: "Consultation package", qty: 1, unitPrice: 12000, amount: 12000 }] },
  { id: "inv-003", clientId: CLIENT_IDS.rutendo, eventId: EVENT_IDS.chigumbaWed, amount: 8500, status: "Draft", dueDate: "2026-06-01", notes: "", lineItems: [{ desc: "Day-of coordination", qty: 1, unitPrice: 8500, amount: 8500 }] },
  { id: "inv-004", clientId: CLIENT_IDS.tariro, eventId: EVENT_IDS.charityAuction, amount: 3200, status: "Overdue", dueDate: "2026-03-15", notes: "Follow up needed", lineItems: [{ desc: "Venue scouting", qty: 1, unitPrice: 3200, amount: 3200 }] },
  { id: "inv-005", clientId: CLIENT_IDS.tariro, eventId: EVENT_IDS.charityAuction, amount: 28000, status: "Paid", dueDate: "2026-02-20", notes: "", lineItems: [{ desc: "Full event management", qty: 1, unitPrice: 20000, amount: 20000 }, { desc: "Design & decor", qty: 2, unitPrice: 4000, amount: 8000 }] },
  { id: "inv-006", clientId: CLIENT_IDS.sophie, eventId: EVENT_IDS.lancasterAnniv, amount: 15000, status: "Sent", dueDate: "2026-07-01", notes: "", lineItems: [{ desc: "Anniversary planning", qty: 1, unitPrice: 15000, amount: 15000 }] },
  { id: "inv-007", clientId: CLIENT_IDS.nyasha, eventId: EVENT_IDS.garweBirthday, amount: 6500, status: "Paid", dueDate: "2026-03-01", notes: "", lineItems: [{ desc: "Consultation & concept", qty: 1, unitPrice: 6500, amount: 6500 }] },
  { id: "inv-008", clientId: CLIENT_IDS.rutendo, eventId: EVENT_IDS.corpRetreat, amount: 22000, status: "Draft", dueDate: "2026-08-15", notes: "", lineItems: [{ desc: "Retreat coordination", qty: 1, unitPrice: 15000, amount: 15000 }, { desc: "Activities planning", qty: 1, unitPrice: 7000, amount: 7000 }] },
  { id: "inv-009", clientId: CLIENT_IDS.tendai, eventId: EVENT_IDS.ndlovuLaunch, amount: 18500, status: "Sent", dueDate: "2026-06-15", notes: "", lineItems: [{ desc: "Launch event management", qty: 1, unitPrice: 12000, amount: 12000 }, { desc: "AV coordination", qty: 1, unitPrice: 6500, amount: 6500 }] },
];

export const seedGuests = (): Guest[] => [
  { id: "gs-001", name: "Tatenda Mapfumo", eventId: EVENT_IDS.moyoGala, email: "tatenda@mapfumo.co.zw", phone: "+263 77 400 1001", rsvp: "Attending", dietary: "Vegetarian", tableGroup: "Table 1" },
  { id: "gs-002", name: "Emily Harlow", eventId: EVENT_IDS.moyoGala, email: "emily@harlow.co.uk", phone: "+44 7700 901002", rsvp: "Pending", dietary: "", tableGroup: "Table 2" },
  { id: "gs-003", name: "Ruvimbo Nyathi", eventId: EVENT_IDS.moyoGala, email: "ruvimbo@nyathi.co.zw", phone: "+263 71 500 1003", rsvp: "Attending", dietary: "Gluten-free", tableGroup: "Table 1" },
  { id: "gs-004", name: "David Thompson", eventId: EVENT_IDS.fashionShow, email: "david@thompson.co.uk", phone: "+44 7911 123456", rsvp: "Declined", dietary: "", tableGroup: "" },
  { id: "gs-005", name: "Farai Mukombe", eventId: EVENT_IDS.charityAuction, email: "farai@mukombe.co.zw", phone: "+263 77 800 2200", rsvp: "Attending", dietary: "Halal", tableGroup: "Table 3" },
  { id: "gs-006", name: "Grace Mutasa", eventId: EVENT_IDS.chigumbaWed, email: "grace@mutasa.co.zw", phone: "+263 71 900 3300", rsvp: "Attending", dietary: "", tableGroup: "Table 2" },
  { id: "gs-007", name: "Oliver Bennett", eventId: EVENT_IDS.lancasterAnniv, email: "oliver@bennett.co.uk", phone: "+44 7911 445566", rsvp: "Pending", dietary: "Vegan", tableGroup: "Table 4" },
  { id: "gs-008", name: "Chenai Dube", eventId: EVENT_IDS.moyoGala, email: "chenai@dube.co.zw", phone: "+263 78 100 4400", rsvp: "Attending", dietary: "", tableGroup: "Table 1" },
  { id: "gs-009", name: "Rumbidzai Pfende", eventId: EVENT_IDS.garweBirthday, email: "rumbi@pfende.co.zw", phone: "+263 77 200 5500", rsvp: "Declined", dietary: "Vegetarian", tableGroup: "" },
  { id: "gs-010", name: "Charlotte Hughes", eventId: EVENT_IDS.lancasterAnniv, email: "charlotte@hughes.co.uk", phone: "+44 7700 667788", rsvp: "Attending", dietary: "", tableGroup: "Table 3" },
];

export const seedExpenses = (): Expense[] => [
  { id: "ex-001", date: "2026-04-02", vendor: "Ruva Florals", category: "Florals", amount: 3200, eventId: EVENT_IDS.moyoGala, notes: "Centerpiece arrangements", receiptUrl: "" },
  { id: "ex-002", date: "2026-04-03", vendor: "Kudza Catering", category: "Catering", amount: 8500, eventId: EVENT_IDS.moyoGala, notes: "Tasting session deposit", receiptUrl: "" },
  { id: "ex-003", date: "2026-03-28", vendor: "Harare Office Supplies", category: "Supplies", amount: 145.50, eventId: "", notes: "Printing & stationery", receiptUrl: "" },
  { id: "ex-004", date: "2026-03-15", vendor: "Lux AV Systems", category: "AV", amount: 4200, eventId: EVENT_IDS.ndlovuLaunch, notes: "Sound system rental deposit", receiptUrl: "" },
  { id: "ex-005", date: "2026-03-20", vendor: "Makanaka Décor", category: "Decor", amount: 6800, eventId: EVENT_IDS.fashionShow, notes: "Custom stage backdrop", receiptUrl: "" },
  { id: "ex-006", date: "2026-04-05", vendor: "ZimTransit Luxury", category: "Transport", amount: 1500, eventId: EVENT_IDS.lancasterAnniv, notes: "VIP shuttle service", receiptUrl: "" },
  { id: "ex-007", date: "2026-02-28", vendor: "Capture Studio", category: "Photography", amount: 3500, eventId: EVENT_IDS.chigumbaWed, notes: "Event photography package", receiptUrl: "" },
  { id: "ex-008", date: "2026-04-01", vendor: "Oliver Bennett Catering", category: "Catering", amount: 12000, eventId: EVENT_IDS.lancasterAnniv, notes: "Full catering package", receiptUrl: "" },
  { id: "ex-009", date: "2026-03-10", vendor: "BeatMasters DJs", category: "Entertainment", amount: 2200, eventId: EVENT_IDS.garweBirthday, notes: "DJ set + equipment", receiptUrl: "" },
  { id: "ex-010", date: "2026-02-15", vendor: "Victoria Falls Hotel", category: "Venue", amount: 18000, eventId: EVENT_IDS.lancasterAnniv, notes: "Venue booking deposit", receiptUrl: "" },
];

export const seedTeam = (): TeamMember[] => [
  { id: TEAM_IDS.chido, name: "Chido Nyakanda", email: "nyakandachido@gmail.com", password: "m@n@n@5", role: "admin", access: ["dashboard","events","clients","vendors","finances","expenses","guests","team"] },
];

export const seedTasks = (): Task[] => [
  // Moyo Gala tasks
  { id: "tk-001", title: "Finalise guest list", eventId: EVENT_IDS.moyoGala, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "High", dueDate: "2026-04-20", completed: false, createdAt: "2026-04-01" },
  { id: "tk-002", title: "Confirm florist arrangements", eventId: EVENT_IDS.moyoGala, assigneeId: TEAM_IDS.chido, stage: "Vendor Coordination", priority: "Medium", dueDate: "2026-05-01", completed: false, createdAt: "2026-04-01" },
  { id: "tk-003", title: "Book AV equipment", eventId: EVENT_IDS.moyoGala, assigneeId: TEAM_IDS.chido, stage: "Vendor Coordination", priority: "High", dueDate: "2026-05-10", completed: false, createdAt: "2026-04-02" },
  { id: "tk-004", title: "Seating chart layout", eventId: EVENT_IDS.moyoGala, assigneeId: TEAM_IDS.chido, stage: "Setup & Logistics", priority: "Medium", dueDate: "2026-06-01", completed: false, createdAt: "2026-04-03" },

  // Fashion Show tasks
  { id: "tk-005", title: "Confirm runway models", eventId: EVENT_IDS.fashionShow, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "High", dueDate: "2026-05-15", completed: false, createdAt: "2026-04-01" },
  { id: "tk-006", title: "Stage design approval", eventId: EVENT_IDS.fashionShow, assigneeId: TEAM_IDS.chido, stage: "Vendor Coordination", priority: "Urgent", dueDate: "2026-06-01", completed: false, createdAt: "2026-04-05" },

  // Chigumba Wedding tasks
  { id: "tk-007", title: "Venue walkthrough", eventId: EVENT_IDS.chigumbaWed, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "Medium", dueDate: "2026-05-20", completed: false, createdAt: "2026-04-01" },
  { id: "tk-008", title: "Photographer briefing", eventId: EVENT_IDS.chigumbaWed, assigneeId: TEAM_IDS.chido, stage: "Vendor Coordination", priority: "Low", dueDate: "2026-07-15", completed: false, createdAt: "2026-04-02" },

  // Charity Auction (wrapped — completed tasks)
  { id: "tk-009", title: "Post-event report", eventId: EVENT_IDS.charityAuction, assigneeId: TEAM_IDS.chido, stage: "Post-Event", priority: "Low", dueDate: "2026-05-20", completed: true, createdAt: "2026-04-01" },

  // Ndlovu Launch tasks
  { id: "tk-010", title: "Product demo rehearsal", eventId: EVENT_IDS.ndlovuLaunch, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "Urgent", dueDate: "2026-07-01", completed: false, createdAt: "2026-04-01" },
  { id: "tk-011", title: "AV systems test", eventId: EVENT_IDS.ndlovuLaunch, assigneeId: TEAM_IDS.chido, stage: "Setup & Logistics", priority: "High", dueDate: "2026-08-20", completed: false, createdAt: "2026-04-03" },

  // Lancaster Anniversary tasks
  { id: "tk-012", title: "Menu tasting session", eventId: EVENT_IDS.lancasterAnniv, assigneeId: TEAM_IDS.chido, stage: "Vendor Coordination", priority: "Medium", dueDate: "2026-07-10", completed: false, createdAt: "2026-04-01" },
  { id: "tk-013", title: "Transport logistics plan", eventId: EVENT_IDS.lancasterAnniv, assigneeId: TEAM_IDS.chido, stage: "Setup & Logistics", priority: "High", dueDate: "2026-09-01", completed: false, createdAt: "2026-04-02" },

  // Garwe Birthday tasks
  { id: "tk-014", title: "Cocktail menu design", eventId: EVENT_IDS.garweBirthday, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "Medium", dueDate: "2026-08-01", completed: false, createdAt: "2026-04-01" },

  // Corporate Retreat tasks
  { id: "tk-015", title: "Activity schedule draft", eventId: EVENT_IDS.corpRetreat, assigneeId: TEAM_IDS.chido, stage: "Planning", priority: "Low", dueDate: "2026-09-15", completed: false, createdAt: "2026-04-01" },
];

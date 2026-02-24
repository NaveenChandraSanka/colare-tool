import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SAMPLE_EVENT = {
  name: "Tech Startup Demo Day 2026",
  slug: "tech-startup-demo-day-2026",
  description:
    "An exclusive showcase of cutting-edge startups presenting their latest innovations. Network with founders, investors, and industry leaders.",
  date: "2026-03-15T10:00:00Z",
  company_name: "Colare",
  loops_event_name: "demo_day_2026.attended",
  status: "active" as const,
};

const SAMPLE_ATTENDEES = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@techcorp.example.com",
    company: "TechCorp",
    role: "VP of Engineering",
    interests: ["demo", "partnership"],
    segment: "demo",
  },
  {
    name: "Marcus Johnson",
    email: "marcus.j@innovate.example.com",
    company: "Innovate Labs",
    role: "Product Manager",
    interests: ["learn-more"],
    segment: "learn-more",
  },
  {
    name: "Priya Patel",
    email: "priya@startupfund.example.com",
    company: "Startup Fund Capital",
    role: "Partner",
    interests: ["partnership", "demo"],
    segment: "partnership",
  },
  {
    name: "James Wilson",
    email: "jwilson@enterprise.example.com",
    company: "Enterprise Solutions Inc",
    role: "CTO",
    interests: ["demo"],
    segment: "demo",
  },
  {
    name: "Aisha Rahman",
    email: "aisha@digitalagency.example.com",
    company: "Digital Agency Co",
    role: "Head of Strategy",
    interests: ["learn-more", "partnership"],
    segment: "learn-more",
  },
];

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create sample event
  console.log("Creating event:", SAMPLE_EVENT.name);
  const { data: event, error: eventError } = await supabase
    .from("events")
    .upsert(SAMPLE_EVENT, { onConflict: "slug" })
    .select()
    .single();

  if (eventError) {
    console.error("Failed to create event:", eventError.message);
    process.exit(1);
  }

  console.log(`  Event created: ${event.id} (slug: ${event.slug})\n`);

  // 2. Create sample attendees
  console.log("Creating attendees...");
  for (const attendee of SAMPLE_ATTENDEES) {
    const { data, error } = await supabase
      .from("attendees")
      .upsert(
        { ...attendee, event_id: event.id },
        { onConflict: "event_id,email" }
      )
      .select()
      .single();

    if (error) {
      console.error(`  Failed: ${attendee.name} - ${error.message}`);
    } else {
      console.log(
        `  Created: ${data.name} (${data.email}) - segment: ${data.segment}`
      );
    }
  }

  console.log("\nSeed completed!");
  console.log(`\nTest registration endpoint:`);
  console.log(
    `  curl -X POST http://localhost:3000/api/events/${event.slug}/register \\`
  );
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(
    `    -d '{"name":"Test User","email":"test@example.com","company":"Test Co","role":"Developer","interests":["demo"]}'`
  );
}

seed().catch(console.error);

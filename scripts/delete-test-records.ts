import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...valParts] = trimmed.split("=");
    const value = valParts.join("=").trim();
    if (!process.env[key.trim()]) process.env[key.trim()] = value;
  }
}

async function deleteTestOrders() {
  const { getSupabaseClient } = await import("@/lib/supabaseClient");
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Supabase client not initialized");
    process.exit(1);
  }

  const OWNER_ID = "f79cf1a6-9e8a-4339-b64e-be6a15fea39a";

  // Find test orders: notes contains "test" (case-insensitive) for this owner
  const { data: testOrders, error: findErr } = await supabase
    .from("orders")
    .select("id")
    .eq("owner_id", OWNER_ID)
    .ilike("notes", "%test%");

  if (findErr) {
    console.error("Error finding test orders:", findErr);
    process.exit(1);
  }

  if (!testOrders || testOrders.length === 0) {
    console.log("No test orders found. Nothing to delete.");
    return;
  }

  const orderIds = testOrders.map((o) => o.id);
  console.log(`Found ${orderIds.length} test orders`);

  // Delete cascading records in dependency order
  const tables: { name: string; match: string; values: string[] }[] = [
    { name: "stock_movements", match: "reference_id", values: orderIds },
    { name: "order_items", match: "order_id", values: orderIds },
    { name: "payments", match: "order_id", values: orderIds },
  ];

  for (const t of tables) {
    const { error } = await supabase.from(t.name).delete().in(t.match, t.values);
    if (error) console.error(`Error deleting from ${t.name}:`, error);
    else console.log(`Deleted from ${t.name}`);
  }

  // Delete test orders
  const { error: orderErr } = await supabase
    .from("orders")
    .delete()
    .in("id", orderIds);

  if (orderErr) console.error("Error deleting test orders:", orderErr);
  else console.log("Deleted test orders");

  console.log("Order cleanup complete.");
}

deleteTestOrders();

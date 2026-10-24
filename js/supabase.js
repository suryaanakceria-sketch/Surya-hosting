/* Nusantara Hosting Panel - Supabase Connection */

// Ganti kedua nilai di bawah dengan data project milikmu.
const SUPABASE_URL = "https://bxujfqlvhqykeizdkfub.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__xw4uJIa6X2lEBwWoDXy_g_eaJmxfQe";

if (
  SUPABASE_URL === "https://bxujfqlvhqykeizdkfub.supabase.co/rest/v1/" ||
  SUPABASE_PUBLISHABLE_KEY === "sb_publishable__xw4uJIa6X2lEBwWoDXy_g_eaJmxfQe"
) {
  console.error("Supabase belum dikonfigurasi. Periksa js/supabase.js.");
} else if (!window.supabase) {
  console.error("Library Supabase belum dimuat.");
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("Supabase client berhasil dibuat.");
}

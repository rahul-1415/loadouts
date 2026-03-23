import { redirect } from "next/navigation";
import MyLoadoutsDashboard from "../../components/MyLoadoutsDashboard";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function MyLoadoutsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-loadouts");
  }

  return <MyLoadoutsDashboard userId={user.id} />;
}

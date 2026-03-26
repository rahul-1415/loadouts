import { redirect } from "next/navigation";
import MyLoadoutsDashboard from "../../components/MyLoadoutsDashboard";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function StudioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/studio");
  }

  return <MyLoadoutsDashboard userId={user.id} />;
}

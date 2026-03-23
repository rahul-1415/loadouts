import { redirect } from "next/navigation";
import MyLoadoutsDashboard from "../../components/MyLoadoutsDashboard";
import StudioInsightsPanel from "../../components/StudioInsightsPanel";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function StudioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/studio");
  }

  return (
    <div className="space-y-8">
      <MyLoadoutsDashboard userId={user.id} />
      <StudioInsightsPanel userId={user.id} />
    </div>
  );
}

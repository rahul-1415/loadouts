import { createClient } from "@supabase/supabase-js";

function parseArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function sanitizeToken(value, fallback) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 10);

  return cleaned || fallback;
}

async function listAllUsers(adminClient) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureUser({ adminClient, email, password, displayName, handle }) {
  const users = await listAllUsers(adminClient);
  const existing = users.find(
    (user) => String(user.email || "").toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return {
      id: existing.id,
      email,
      created: false,
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: displayName,
      preferred_username: handle,
    },
  });

  if (error || !data.user) {
    throw new Error(`Unable to create user ${email}: ${error?.message}`);
  }

  return {
    id: data.user.id,
    email,
    created: true,
  };
}

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const seedToken = sanitizeToken(
    parseArg("seed", process.env.TEST_USER_SEED || "demo"),
    "demo"
  );
  const password =
    parseArg("password", process.env.TEST_USER_PASSWORD || "") || "Loadouts!12345";

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const seeds = [
    { key: "creator", displayName: "Demo Creator" },
    { key: "reviewer", displayName: "Demo Reviewer" },
    { key: "editor", displayName: "Demo Editor" },
    { key: "camera", displayName: "Demo Camera" },
    { key: "audio", displayName: "Demo Audio" },
  ].map((item, index) => ({
    email: `loadouts_${seedToken}_${index + 1}@example.com`,
    handle: `${item.key}_${seedToken}`.slice(0, 30),
    displayName: item.displayName,
  }));

  const users = [];
  for (const seed of seeds) {
    const user = await ensureUser({
      adminClient,
      email: seed.email,
      password,
      displayName: seed.displayName,
      handle: seed.handle,
    });
    users.push({ ...seed, ...user });
  }

  const profilesPayload = users.map((user) => ({
    id: user.id,
    handle: user.handle,
    display_name: user.displayName,
    bio: `Seeded social profile for ${seedToken}`,
    interests: ["creator-tools", "gear", "workflow"],
  }));

  const { error: profilesError } = await adminClient
    .from("profiles")
    .upsert(profilesPayload, { onConflict: "id" });

  if (profilesError) {
    throw new Error(`Unable to seed profiles: ${profilesError.message}`);
  }

  const { data: categoryData, error: categoryError } = await adminClient
    .from("categories")
    .select("id")
    .eq("slug", "cat-013")
    .limit(1)
    .maybeSingle();

  if (categoryError) {
    throw new Error(`Unable to fetch category: ${categoryError.message}`);
  }

  const categoryId = categoryData?.id ?? null;
  if (!categoryId) {
    throw new Error("Missing category cat-013. Run seed-100-categories.sql first.");
  }

  const owner = users[0];
  const loadoutSlug = `demo-social-${seedToken}`;
  const { data: loadoutData, error: loadoutError } = await adminClient
    .from("collections")
    .upsert(
      {
        owner_id: owner.id,
        category_id: categoryId,
        kind: "loadout",
        slug: loadoutSlug,
        title: `Demo Social Kit (${seedToken})`,
        description: "Seeded loadout for testing follows, likes, and comments.",
        is_public: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (loadoutError || !loadoutData) {
    throw new Error(`Unable to upsert demo loadout: ${loadoutError?.message}`);
  }

  const loadoutId = loadoutData.id;

  const { data: productRows, error: productError } = await adminClient
    .from("products")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(3);

  if (productError) {
    throw new Error(`Unable to fetch products: ${productError.message}`);
  }

  const productIds = (productRows ?? []).map((row) => row.id).filter(Boolean);
  if (productIds.length > 0) {
    const joinRows = productIds.map((productId, index) => ({
      collection_id: loadoutId,
      product_id: productId,
      sort_order: index + 1,
      note: `Seed item ${index + 1}`,
    }));

    const { error: joinError } = await adminClient
      .from("collection_products")
      .upsert(joinRows, { onConflict: "collection_id,product_id" });

    if (joinError) {
      throw new Error(`Unable to seed collection products: ${joinError.message}`);
    }
  }

  const follows = [
    [users[1].id, owner.id],
    [users[2].id, owner.id],
    [users[3].id, owner.id],
    [users[4].id, owner.id],
    [users[2].id, users[1].id],
  ]
    .filter(([followerId, followingId]) => followerId !== followingId)
    .map(([followerId, followingId]) => ({
      follower_id: followerId,
      following_id: followingId,
    }));

  const { error: followsError } = await adminClient
    .from("follows")
    .upsert(follows, { onConflict: "follower_id,following_id" });

  if (followsError) {
    throw new Error(`Unable to seed follows: ${followsError.message}`);
  }

  const likeRows = [users[1].id, users[2].id, users[3].id].map((userId) => ({
    user_id: userId,
    collection_id: loadoutId,
  }));

  const { error: likesError } = await adminClient
    .from("likes")
    .upsert(likeRows, { onConflict: "user_id,collection_id" });

  if (likesError) {
    throw new Error(`Unable to seed likes: ${likesError.message}`);
  }

  for (const commenter of [users[1], users[2], users[4]]) {
    const body = `[seed:${seedToken}] Great loadout by @${owner.handle}`;
    const { data: existingComment, error: existingCommentError } = await adminClient
      .from("comments")
      .select("id")
      .eq("collection_id", loadoutId)
      .eq("user_id", commenter.id)
      .eq("body", body)
      .limit(1)
      .maybeSingle();

    if (existingCommentError) {
      throw new Error(
        `Unable to check existing comments for ${commenter.email}: ${existingCommentError.message}`
      );
    }

    if (!existingComment) {
      const { error: commentError } = await adminClient.from("comments").insert({
        collection_id: loadoutId,
        user_id: commenter.id,
        body,
      });

      if (commentError) {
        throw new Error(
          `Unable to seed comment for ${commenter.email}: ${commentError.message}`
        );
      }
    }
  }

  const { error: notificationError } = await adminClient.from("notifications").insert({
    recipient_id: owner.id,
    actor_id: users[1].id,
    type: "follow",
    entity_type: "profile",
    entity_id: users[1].id,
    metadata: {
      seeded: true,
      seedToken,
    },
  });

  if (notificationError && notificationError.code !== "23505") {
    throw new Error(`Unable to seed notification: ${notificationError.message}`);
  }

  console.log("Seed complete.");
  console.log(`Seed token: ${seedToken}`);
  console.log(`Password for created users: ${password}`);
  console.table(
    users.map((user) => ({
      email: user.email,
      handle: user.handle,
      created: user.created ? "yes" : "no",
    }))
  );
  console.log(`Demo loadout: /loadouts/${loadoutSlug}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

export async function onRequestGet(context) {
  const { env } = context;
  const query = `
    SELECT
      id,
      username,
      role,
      avatar_url,
      joined_at
    FROM roster_members
    ORDER BY
      CASE role
        WHEN 'Leader' THEN 1
        WHEN 'Admin' THEN 2
        WHEN 'Officer' THEN 3
        WHEN 'Member' THEN 4
        ELSE 5
      END ASC,
      username ASC;
  `;
  try {
    const { results } = await env.DB.prepare(query).all();
    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
export async function onRequest(context) {
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
      END ASC;
  `;

  try {
    const { results } = await env.DB.prepare(query).all();
    return Response.json(results);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

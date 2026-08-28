// functions/api/announcements.js

export async function onRequestGet(context) {
  const { DB } = context.env;
  try {
    const { results } = await DB.prepare(
      `SELECT * FROM announcements ORDER BY created_at DESC LIMIT 6`
    ).all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  try {
    const { title, body, category } = await context.request.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'Title and body are required' }), { status: 400 });
    }

    await DB.prepare(
      `INSERT INTO announcements (title, body, category) VALUES (?, ?, ?)`
    ).bind(title, body, category || 'ANNOUNCEMENT').run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// functions/api/bracket.js

/**
 * GET /api/bracket
 * GET /api/bracket?home=true
 */
export async function onRequestGet(context) {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const homeOnly = url.searchParams.get('home') === 'true';

  try {
    // Query for the latest bracket, filtering by published_to_home if requested
    let query = `SELECT * FROM brackets ORDER BY updated_at DESC LIMIT 1`;
    if (homeOnly) {
      query = `SELECT * FROM brackets WHERE published_to_home = 1 ORDER BY updated_at DESC LIMIT 1`;
    }

    const { results } = await DB.prepare(query).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify(null), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const bracket = results[0];
    // Parse bracket_data string back into a JSON object for frontend consumption
    bracket.bracket_data = JSON.parse(bracket.bracket_data);

    return new Response(JSON.stringify(bracket), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/bracket
 * Payload: { id?: number, title: string, bracket_data: object, published_to_home: boolean }
 */
export async function onRequestPost(context) {
  const { DB } = context.env;

  try {
    const body = await context.request.json();
    const { id, title, bracket_data, published_to_home } = body;

    if (!title || !bracket_data) {
      return new Response(JSON.stringify({ error: 'Missing title or bracket data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jsonString = JSON.stringify(bracket_data);
    const isPublished = published_to_home ? 1 : 0;

    // Update existing record if ID is provided, otherwise insert new record
    if (id) {
      await DB.prepare(
        `UPDATE brackets 
         SET title = ?, bracket_data = ?, published_to_home = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(title, jsonString, isPublished, id).run();
    } else {
      await DB.prepare(
        `INSERT INTO brackets (title, bracket_data, published_to_home) 
         VALUES (?, ?, ?)`
      ).bind(title, jsonString, isPublished).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Bracket saved successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

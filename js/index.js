/* ============================================================
   Himawari Clan — Worker entry point
   Handles /api/* routes against the D1 database (env.DB).
   Everything else falls through to the static site files
   (env.ASSETS), exactly like before.
   ============================================================ */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function badRequest(message) {
  return json({ error: message }, 400);
}

// Simple table config: table name -> required fields for a create/update
const TABLES = {
  roster: {
    columns: ['id', 'initials', 'name', 'role', 'meta'],
    order: 'sort_order ASC, rowid ASC',
  },
  announcements: {
    columns: ['id', 'title', 'body', 'date'],
    order: 'rowid DESC',
  },
  tournaments: {
    columns: ['id', 'name', 'date', 'format', 'status'],
    order: 'rowid DESC',
  },
  applicants: {
    columns: ['id', 'ign', 'rank', 'discord', 'notes', 'date'],
    order: 'rowid DESC',
  },
};

async function handleList(env, table) {
  const cfg = TABLES[table];
  const { results } = await env.DB.prepare(
    `SELECT * FROM ${table} ORDER BY ${cfg.order}`
  ).all();
  return json(results);
}

async function handleCreateOrUpdate(env, table, request) {
  const cfg = TABLES[table];
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return badRequest('Invalid JSON body');
  }
  if (!body.id) return badRequest('Missing id');

  const cols = cfg.columns;
  const values = cols.map((c) => (c in body ? body[c] : null));
  const placeholders = cols.map(() => '?').join(', ');
  const updateClause = cols
    .filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');

  await env.DB.prepare(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updateClause}`
  ).bind(...values).run();

  return json({ ok: true, id: body.id });
}

async function handleDelete(env, table, id) {
  await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      const parts = path.split('/').filter(Boolean); // ["api", "roster", "<id>"?]
      const table = parts[1];
      const id = parts[2];

      if (!TABLES[table]) {
        return json({ error: 'Unknown resource' }, 404);
      }

      try {
        if (request.method === 'GET' && !id) {
          return await handleList(env, table);
        }
        if (request.method === 'POST' && !id) {
          return await handleCreateOrUpdate(env, table, request);
        }
        if (request.method === 'DELETE' && id) {
          return await handleDelete(env, table, id);
        }
        return json({ error: 'Method not allowed' }, 405);
      } catch (err) {
        return json({ error: 'Server error', detail: String(err) }, 500);
      }
    }

    // Not an API route — serve the static site as before.
    return env.ASSETS.fetch(request);
  },
};

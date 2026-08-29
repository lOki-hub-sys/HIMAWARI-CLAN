export async function onRequestGet(context) {
    try {
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM roster_members"
        ).all();

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
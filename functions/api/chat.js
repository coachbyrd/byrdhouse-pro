// Pages Function for POST /api/chat. Same behavior as the handler in server.js:
// forward the JSON body to Anthropic and return the JSON response unchanged.
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return Response.json(data, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }
}

async function hello(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'dev/hello' }),
  };
}

export const handler = hello;



async function createAuction(event, context) {

  const { title } = JSON.parse(event.body);
  const now  =new Date();

  const auction ={
    title,
    status: 'OPEN',
    createdAt: now.toISOString()
  };

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = createAuction;



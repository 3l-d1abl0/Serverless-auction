import AWS from 'aws-sdk';


const ses = new AWS.SES({ region: 'ap-south-1'});

async function sendMail(event, context ){

    const params ={
        Source: 'verified@email.com',
        Destination: {
            ToAddresses: ['email@example.com'],
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Bonsoir Elliot !'
                },
            },
            Subject: {
                Data: 'Test Mail',
            },
        },
    };

    try{
        const result = await ses.sendEmail(params).promise();
        console.log(result);
        return result;
    }catch(error){
        console.error(error);
    } 
}
export const handler = sendMail;
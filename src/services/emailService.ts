import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
require('dotenv').config();

const sesClient = new SESClient({
  region: 'ap-southeast-2', // Specify the AWS region here
});

function createSendEmailCommand(
  toAddress: string,
  fromAddress: string,
  message: string
) {
  return new SendEmailCommand({
    Destination: {
      ToAddresses: [toAddress],
    },
    Source: fromAddress,
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: "Your One-time Password",
      },
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: message,
        },
      },
    },
  });
}

export async function sendEmailToken(email: string, token: string) {
  console.log("email:", email, token);

  const message = `Your One-Time Password: ${token}`;
  const command = createSendEmailCommand(
    email,
    "rahulnara41@gmail.com",
    message
  );

  try {
    return await sesClient.send(command);
  } catch (error) {
    console.log("Error sending email", error);
  }
}




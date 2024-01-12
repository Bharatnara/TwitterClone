import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { sendEmailToken } from "../services/emailService";


const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
const AUTHENTICATION_EXPIRATION_HOURS = 12
const JWT_SECRET = process.env.JWT_SECRET || "SECRET";

const router = Router();
const prisma = new PrismaClient();

// Generate a random 6 digit number as the email Token
function generateEmailToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAuthToken(tokenId: number): string {
  const jwtPayload = {tokenId};
  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: 'HS256',
    noTimestamp : true,
  });
}

// EndPoints
// Create a user, If it doesnt exist, Generate the eamilToken and send it to the email
router.post("/login", async (req, res) => {
  const { email, name, username } = req.body;

  // Generate token
  const emailToken = generateEmailToken();
  const expiration = new Date(
    new Date().getTime() + EMAIL_TOKEN_EXPIRATION_MINUTES * 60 * 1000
  );

  try {
    const createdToken = await prisma.token.create({
      data: {
        type: "EMAIL",
        emailToken,
        expiration,
        user: {
          connectOrCreate: {
            where: { email },
            create: {
              email,
              name: name || "", // Include name if provided, or default to an empty string
              username: username || "", // Include username if provided, or default to an empty string
            },
          },
        },
      },
    });

    res.json(createdToken);
    await sendEmailToken(email, emailToken)
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Authentication Failed!" });
  }
});

// Validate the emailToken and Generate the long-lived JWT Token
router.post("/authenticate", async (req, res) => {
  const { email, emailToken } = req.body;
  console.log(email, emailToken);

  const dbEmailToken = await prisma.token.findUnique({
    where: { emailToken },
    include: {
      user: true,
    },
  });
  console.log(dbEmailToken);
  if (!dbEmailToken || !dbEmailToken.valid) {
    return res.sendStatus(401).json({ error: "Invalid or expired token." });
  }
  if (dbEmailToken.expiration < new Date()) {
    return res.status(401).json({ error: "Token expired!" });
  }

  if (dbEmailToken?.user?.email !== email) {
    return res.sendStatus(401);
  }

  // Generate and APT Token
  const expiration = new Date(
    new Date().getTime() + AUTHENTICATION_EXPIRATION_HOURS * 60 * 60 * 1000
  );

  const apiToken = await prisma.token.create({
    data: {
      type: "API",
      expiration,
      user: {
        connect: {
          email
        }
      }
    },
  });

  // Invalidate the Email Token
  await prisma.token.update({
    where: {id: dbEmailToken.id},
    data: {valid: false},
  })

  // Generate the JWT Token
  const authToken = generateAuthToken(apiToken.id)
  res.json ({authToken})
});
export default router;

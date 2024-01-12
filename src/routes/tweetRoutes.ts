import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Tweet CRUD
// Create Tweet
router.post("/", async (req, res) => {
  const { content, image } = req.body;
  // @ts-ignore
  const user = req.user;

  try {
    const result = await prisma.tweet.create({
      data: { content, image, userId: user.id },
    });
    res.json(result);
    result;
  } catch (error) {
    res.status(400).json({ error: "Something went wrong!" });
  }
});

// List of Tweet
router.get("/", async (req, res) => {
  const allTweets = await prisma.tweet.findMany({
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  res.json(allTweets);
});

// get one Tweet
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const tweet = await prisma.tweet.findUnique({ where: { id: Number(id) } });
  if (!tweet) {
    return res.status(404).json({ error: "Tweet not Found!" });
  }
  res.json(tweet);
});

// //  Update Tweet
// router.put(":id", (req, res) => {
//   const { id } = req.params;
//   res.status(501).json({ error: `Not Implemented ${id}` });
// });

// Delete Tweet
router.delete(":id", async (req, res) => {
  const { id } = req.params;
  await prisma.tweet.delete({ where: { id: Number(id) } });
  res.status(501).json({ error: `Not Implemented ${id}` });
});

export default router;

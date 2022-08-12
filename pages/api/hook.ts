import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import { NextApiResponseServerIO } from "../../types/next";

const handler = nextConnect();

handler.post(async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const status = req.body.data.payload.to[0].status;
  const number = req.body.data.payload.to[0].phone_number;

  const message = {
    response: `Message to ${number} ${status}`,
  };

  res?.socket?.server?.io?.emit("status", {
    number,
    status,
  });

  // return message
  res.status(201).json(message);
});

export default handler;

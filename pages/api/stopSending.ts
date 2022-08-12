import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import { data } from "../../data";
import { NextApiResponseServerIO } from "../../types/next";

const handler = nextConnect();

handler.post(async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const stopSending = JSON.parse(req.body).stopSending;

  data.stopSending = stopSending;

  res.end();
});

export default handler;

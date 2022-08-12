import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import middleware from "../../middleware/middleware";
import tx from "telnyx";
import fs from "fs";
import { numbersToArray } from "../../utility/numbersToArray";
import { delay } from "../../utility/delay";
import { NextApiResponseServerIO } from "../../types/next";
import { data } from "../../data";

interface ExtendedRequest extends NextApiRequest {
  files: any;
}

const handler = nextConnect();
handler.use(middleware);

handler.post(async (req: ExtendedRequest, res: NextApiResponseServerIO) => {
  const file = req.files.file;
  const values = JSON.parse(req.body.data);
  let numbers = numbersToArray(
    file ? fs.readFileSync(file[0].path).toString() : values.numbers
  ).map((number) => `+${number}`);

  const message = values.message;
  const apiKey = values.apiKey;
  const msgProfileId = values.msgProfileId;

  const telnyx = tx(apiKey);

  res?.socket?.server?.io?.emit("loading", {
    status: true,
  });

  res?.socket?.server?.io?.emit("allSent", false);

  for (const number of numbers) {
    if (data.stopSending) break;

    telnyx.messages.create(
      {
        to: number,
        text: message,
        messaging_profile_id: msgProfileId,
      },
      async (err: any) => {
        if (err) {
          console.log(`err: `, err);
        }
      }
    );

    await delay(110);
  }

  res?.socket?.server?.io?.emit("loading", {
    status: false,
  });

  res?.socket?.server?.io?.emit("allSent", true);

  setTimeout(() => {
    res?.socket?.server?.io?.emit("loading", {
      status: null,
    });
  }, 5000);

  data.stopSending = false;
  res.send(`Okay`);
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;

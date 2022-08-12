import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import middleware from "../../middleware/middleware";
import { NextApiResponseServerIO } from "../../types/next";
import { encrypt } from "../../utility/encrypt";

interface ExtendedRequest extends NextApiRequest {
  files: any;
}

const handler = nextConnect();
handler.use(middleware);

handler.post(async (req: ExtendedRequest, res: NextApiResponseServerIO) => {
  const values = req.body.unencrypted[0];
  const uncrypted = req.body.unencrypted[0];

  const text = [...uncrypted].map((e) => {
    const char = encrypt(e);

    if (char) return char;

    return e;
  });

  res.send({
    encrypted: text.join(``),
  });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;

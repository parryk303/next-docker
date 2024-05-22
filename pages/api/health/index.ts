import { NextApiRequest, NextApiResponse } from 'next';

const health = (req: NextApiRequest, res: NextApiResponse) => {
  const responseMessage = 'managed-services-balance-tool is up 🟢';
  res.status(200).json({ message: responseMessage });
};

export default health;

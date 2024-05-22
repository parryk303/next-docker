import { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import cookie from 'cookie';

dotenv.config();
const cache = new NodeCache();

const redirect = process.env.SF_REDIRECT_URL!;
const jwtSecret = process.env.SF_JWT_SECRET!;
const secret = process.env.SF_SECRET!;
const id = process.env.SF_KEY!;

const setToken = async (token: any) => {
  const jwtToken = jwt.sign(token, jwtSecret, { algorithm: 'HS256', expiresIn: '8h' });
  return jwtToken;
};

const getToken = async (req: NextApiRequest) => {
  const jwtToken = req.cookies?.access;
  console.log('jwt GET: ', jwtToken);
  if (jwtToken) {
    try {
      const token = await new Promise((resolve, reject) => {
        jwt.verify(jwtToken, jwtSecret, { algorithms: ['HS256'] }, (err, decoded) => {
          if (err) {
            console.error('Failed to verify token:', err);
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });
      return token as { instanceUrl: string; accessToken: string; refreshToken: string; };
    } catch (error) {
      return undefined;
    }
  } else {
    return undefined;
  }
};

export const decodeJWT = async (jwtToken: string) => {
  try {
    const token = await new Promise((resolve, reject) => {
      jwt.verify(jwtToken, jwtSecret, (err, decoded) => {
        if (err) {
          console.error('Failed to verify token:', err);
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
    return token as { instanceUrl: string; accessToken: string; refreshToken: string; };
  } catch (error) {
    return undefined;
  }
};

const login = async (req: NextApiRequest, res: NextApiResponse) => {
  const token: undefined | { instanceUrl: string; accessToken: string; refreshToken: string } = await getToken(req);

  const oauth2 = new jsforce.OAuth2({
    clientId: id,
    clientSecret: secret,
    redirectUri: redirect
  });

  if (!token) {
    res.redirect(oauth2.getAuthorizationUrl({ scope: 'api refresh_token offline_access' }));
  } else {
    res.redirect('/');
  }
};

const callback = async (req: NextApiRequest, res: NextApiResponse) => {
  const token: undefined | { instanceUrl: string; accessToken: string; refreshToken: string } = await getToken(req);
  const { code } = req.query;
  let authCode = '';

  const oauth2 = new jsforce.OAuth2({
    clientId: id,
    clientSecret: secret,
    redirectUri: redirect
  });

  if (code) {
    authCode = String(code);
  }

  const conn = new jsforce.Connection({ oauth2 });

  if (!token) {
    conn.authorize(authCode, async (err, userInfo) => {
      if (err) {
        return res.status(500).send('Authorization failed');
      }
      // Store the access token, refresh token, and instance URL securely
      const accessToken = conn.accessToken;
      const refreshToken = conn.refreshToken;
      const instanceUrl = conn.instanceUrl;

      // Set cache and check the result
      const accessTokenSet = cache.set('accessToken', accessToken);
      const instanceUrlSet = cache.set('instanceUrl', instanceUrl);
      const refreshTokenSet = cache.set('refreshToken', refreshToken);

      const access_token = encodeURIComponent(await setToken({ instanceUrl, accessToken, refreshToken }));
      res.setHeader('Set-Cookie', cookie.serialize('access', access_token, { maxAge: 14400, httpOnly: false }));

      if (!accessTokenSet) {
        console.error('Failed to set access token in cache');
      }

      if (!instanceUrlSet) {
        console.error('Failed to set instance URL in cache');
      }

      if (!refreshTokenSet) {
        console.error('Failed to set refresh token in cache');
      }

      return res.redirect('/');
    });
  }
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    return login(req, res);
  } else if (req.method === 'POST') {
    return callback(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

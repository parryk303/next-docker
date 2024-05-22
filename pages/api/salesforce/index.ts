import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import jsforce from 'jsforce';
import dotenv from 'dotenv';
dotenv.config();

const instanceUrl = process.env.SF_INSTANCE_URL!;
const jwtSecret = process.env.SF_JWT_SECRET!;

const salesforce = async (req: NextApiRequest, res: NextApiResponse) => {
    const decodeJWT = async (jwtToken: string) => {
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

    const authHeader = req.headers.authorization;
    const { query, info } = req.body;

    if (!authHeader) {
        return res.status(401).send('Authorization header is missing');
    }

    const jwtToken = authHeader.split('token ')[1];
    const token: any = await decodeJWT(jwtToken);
    const accessToken = token.accessToken;

    if (accessToken) {
        const conn = new jsforce.Connection({
            instanceUrl,
            accessToken
        });

        let response: any;

        if (query) {
            try {
                response = await conn.query(`${query}`);
                console.log(`🟣[salesforce]: ${query}`);
            } catch (error: any) {
                console.log('🟣[salesforce]: custom query error', error);
                return res.status(500).send('Custom query error');
            }
        }

        if (info) {
            if (info === 'all') {
                const globalDescribe = await conn.describeGlobal();
                const sobjects = globalDescribe.sobjects;

                const result: any = {};
                for (const sobject of sobjects) {
                    const describe = await conn.sobject(sobject.name).describe();
                    const fields = describe.fields.map(field => field.name);
                    result[sobject.name] = fields;
                    console.log(`Object: ${sobject.name}`);
                }
                response = result;
            } else {
                const describe = await conn.sobject(info).describe();
                const fields = describe.fields.map(field => field.name);
                response = fields;
                console.log(`🟣[salesforce]: ${info}`);
            }
        }

        return res.status(200).json(response);
    } else {
        return res.status(401).send('Access token is missing or invalid');
    }
};

export default salesforce;

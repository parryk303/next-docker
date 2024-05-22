import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const sheetId = Number(process.env.SMARTSHEET_SHEET_ID);
const rowId = Number(process.env.SMARTSHEET_ROW_ID);
const callbackUrl = `${process.env.BASE_URL}/webhook`;

export const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const createWebhook = async () => {
  await axios
    .post(
      'https://api.smartsheet.com/2.0/webhooks',
      {
        callbackUrl: callbackUrl,
        events: ['*.*'],
        name: 'Balance Sheet Tracking',
        version: '1',
        scopeObjectId: sheetId,
        scope: 'sheet',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMARTSHEET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    .then((response: any) => console.log(response.data))
    .catch((err: any) => console.log(err));
}

export const activateWebhook = async (webhookId:number) => {
  await axios
    .put(
      `https://api.smartsheet.com/2.0/webhooks/${webhookId}`,
      {
        enabled: true, // set enabled to true, you can set enabled to false for developement
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMARTSHEET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    .then((response: any) => {
      console.log(response.data);
    })
    .catch((err: any) => {
      console.log(err);
    });
}

export const listWebhooks = async () => {
  await axios
    .get(`https://api.smartsheet.com/2.0/webhooks`, {
      headers: {
        Authorization: `Bearer ${process.env.SMARTSHEET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response: any) => {
      console.log(response.data);
    })
    .catch((err: any) => {
      console.log(err);
    });
}

export const deleteWebhook = async (webhookId:number) => {
  await axios
    .delete(`https://api.smartsheet.com/2.0/webhooks/${webhookId}`, {
      headers: {
        Authorization: `Bearer ${process.env.SMARTSHEET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response: any) => {
      console.log(response.data);
    })
    .catch((err: any) => {
      console.log(err);
    });
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
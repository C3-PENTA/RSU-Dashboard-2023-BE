import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as https from 'https';

export async function fetchUrl(url: string) {
  const rejectUnauthorized = process.env.NODE_ENV == 'PROD' ? true : false;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: rejectUnauthorized,
  });

  try {
    return lastValueFrom(
      new HttpService().get(url, {
        httpsAgent,
      }),
    );
  } catch (err) {
    console.error(`Error fetching from ${url}:`, err);
  }
}

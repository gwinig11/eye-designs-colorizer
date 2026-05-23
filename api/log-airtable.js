export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  },
  maxDuration: 300
};

const AIRTABLE_BASE_ID = 'appoSB8HxwIvhIXs2';
const AIRTABLE_TABLE_NAME = 'Image Requests';
const AIRTABLE_GALLERY_FIELD = 'Gallery';
const AIRTABLE_API_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const AIRTABLE_CONTENT_BASE = `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const normalizeEnvValue = (value) => (
  value && value !== 'undefined' && value !== 'null' ? value : undefined
);

const getAirtableToken = () => (
  normalizeEnvValue(process.env.AIRTABLE_API_KEY)
  || normalizeEnvValue(process.env.AIRTABLE_PAT)
  || normalizeEnvValue(process.env.AIRTABLE_TOKEN)
);

const airtableHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const parseDataUrl = (dataUrl) => {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || '');

  if (!match || !match[2]) {
    throw new Error('Expected a base64 data URL attachment.');
  }

  return {
    contentType: match[1] || 'image/png',
    base64: match[3]
  };
};

const remoteUrlToAttachmentFile = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download attachment URL: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return { contentType, base64 };
};

const sourceToAttachmentFile = async (source) => {
  if (typeof source !== 'string' || source.trim() === '') {
    throw new Error('Missing attachment source.');
  }

  if (/^https?:\/\//i.test(source)) {
    return remoteUrlToAttachmentFile(source);
  }

  return parseDataUrl(source);
};

const getAirtableErrorMessage = async (response) => {
  const body = await response.json().catch(() => null);
  return body?.error?.message || body?.error || `Airtable request failed with status ${response.status}`;
};

const createImageRequestRecord = async (token, fields = {}) => {
  const response = await fetch(`${AIRTABLE_API_BASE}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`, {
    method: 'POST',
    headers: airtableHeaders(token),
    body: JSON.stringify({
      records: [
        {
          fields
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(await getAirtableErrorMessage(response));
  }

  const body = await response.json();
  const record = body.records?.[0];

  if (!record?.id) {
    throw new Error('Airtable did not return a record id.');
  }

  return record;
};

const deleteImageRequestRecord = async (token, recordId) => {
  const response = await fetch(
    `${AIRTABLE_API_BASE}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${encodeURIComponent(recordId)}`,
    {
      method: 'DELETE',
      headers: airtableHeaders(token)
    }
  );

  if (!response.ok) {
    throw new Error(await getAirtableErrorMessage(response));
  }

  return response.json();
};

const uploadGalleryAttachment = async ({ token, recordId, source, filename }) => {
  const { contentType, base64 } = await sourceToAttachmentFile(source);
  const response = await fetch(
    `${AIRTABLE_CONTENT_BASE}/${encodeURIComponent(recordId)}/${encodeURIComponent(AIRTABLE_GALLERY_FIELD)}/uploadAttachment`,
    {
      method: 'POST',
      headers: airtableHeaders(token),
      body: JSON.stringify({
        contentType,
        file: base64,
        filename
      })
    }
  );

  if (!response.ok) {
    throw new Error(await getAirtableErrorMessage(response));
  }

  return response.json();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const token = getAirtableToken();

  if (!token) {
    return res.status(500).json({ error: 'Missing AIRTABLE_API_KEY server environment variable.' });
  }

  const { action } = req.body || {};

  try {
    if (action === 'create') {
      const {
        style = '',
        specialInstructions = '',
        requestStartTime = '',
        requestCompletionTime = ''
      } = req.body || {};
      const record = await createImageRequestRecord(token, {
        Style: style,
        'Special Instructions': specialInstructions,
        'Request Start Time': requestStartTime,
        'Request Completion Time': requestCompletionTime
      });
      return res.status(200).json({ recordId: record.id });
    }

    if (action === 'upload') {
      const { recordId, source, filename = 'image.png' } = req.body || {};

      if (!recordId) {
        return res.status(400).json({ error: 'Missing Airtable record id.' });
      }

      await uploadGalleryAttachment({
        token,
        recordId,
        source,
        filename
      });

      return res.status(200).json({ ok: true, recordId });
    }

    if (action === 'delete') {
      const { recordId } = req.body || {};

      if (!recordId) {
        return res.status(400).json({ error: 'Missing Airtable record id.' });
      }

      await deleteImageRequestRecord(token, recordId);

      return res.status(200).json({ ok: true, recordId });
    }

    return res.status(400).json({ error: 'Unknown Airtable log action.' });
  } catch (err) {
    console.error('[airtable-log] failed', {
      action,
      message: err.message
    });

    return res.status(502).json({ error: err.message || 'Failed to log images to Airtable.' });
  }
}

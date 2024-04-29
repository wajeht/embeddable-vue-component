import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import express from 'express';
import cors from 'cors';

dotenv.config({ path: path.resolve(path.join(process.cwd(), '.env')) });

const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

class UnauthorizeError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 422;
  }
}

const db = [
  {
    id: 1,
    slug: 'demo',
    allowed_domains: ['http://localhost/', 'https://embeddable-vue-component.jaw.dev/'],
    submissions: [
      {
        id: 1,
        rating: 5,
        feedback: 'so bad',
      },
    ],
  },
  {
    id: 2,
    slug: 'code-pen',
    allowed_domains: ['https://cdpn.io/'],
    submissions: [
      {
        id: 1,
        rating: 5,
        feedback: 'so good',
      },
    ],
  },
];

const app = express();

app.use(cors());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: 'same-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'https://embeddable-vue-component.jaw.dev'],
      },
    },
  }),
);

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.resolve(path.join(process.cwd(), 'public')), { maxAge: '24h' }));

app.get('/api/feedback/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug) throw new ValidationError('must include a slug');

    const feedback = db.find((fb) => fb.slug === slug);

    if (!feedback) throw new NotFoundError('not found');

    return res.status(200).json({ message: 'feedback retrieved successfully', data: feedback });
  } catch (error) {
    next(error);
  }
});

app.post('/api/feedback/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    const { rating, feedback } = req.body;

    if (!rating) throw new ValidationError('must include a rating');
    if (!feedback) throw new ValidationError('must include feedback');
    if (parseInt(rating) < 1 || parseInt(rating) > 5) throw new ValidationError('rating must be between 1 and 5');
    if (feedback.trim().length === 0) throw new ValidationError('feedback must not be empty');
    if (feedback.trim().length > 225) throw new ValidationError('feedback must be 225 characters or less');

    const record = db.find((item) => item.slug === slug);

    if (!record) throw new NotFoundError(`no record found for slug: ${slug}`);

    if (!record.allowed_domains.includes(req.headers.referer)) throw new UnauthorizeError('forbidden');

    const submission = {
      id: record.submissions.length + 1,
      rating: parseInt(rating),
      feedback: feedback.trim(),
    };

    record.submissions.push(submission);

    return res.status(200).json({ message: 'feedback submitted successfully', data: submission });
  } catch (error) {
    next(error);
  }
});

app.get('/healthz', (req, res) => {
  return res.status(200).send('<h1>ok</h1>');
});

app.get('/feedback/:slug/widget.js', async (req, res, next) => {
  try {
    const slug = req.params.slug;

    if (!slug) throw new ValidationError('must include a slug');

    const feedback = db.find((fb) => fb.slug === slug);

    if (!feedback) throw new NotFoundError('not found');

    if (!feedback.allowed_domains.includes(req.headers.referer)) throw new UnauthorizeError('forbidden');

    if (req.query.embed === 'true') {
      const widget = path.resolve(path.join(process.cwd(), 'dist', 'widget.umd.js'));
      return res
        .status(200)
        .set('Content-Type', 'application/javascript')
        .set('Cache-Control', 'public, max-age=86400') // 24 hours
        .sendFile(widget);
    }

    const protocol = req.hostname.includes('localhost') ? 'http://' : 'https://';
    const port = req.hostname.includes('localhost') ? `:${process.env.PORT}` : '';

    const javascript = `
      (function() {
        const feedbackWidget = document.createElement('feedback-widget');
        feedbackWidget.setAttribute('slug', "${slug}");
        document.body.appendChild(feedbackWidget);

        const script = document.createElement('script');
        script.src = '${protocol}${req.hostname}${port}/feedback/${slug}/widget.js?embed=true';
        document.body.appendChild(script);
      })();
    `;

    return res
      .set('Content-Type', 'application/javascript')
      .set('Cache-Control', 'public, max-age=86400') // 24 hours
      .send(javascript);
  } catch (error) {
    next(error);
  }
});

app.get('/', (req, res) => {
  const liveJs = isDevelopmentEnvironment ? '<script src="/live.js"></script>' : '';

  const protocol = req.hostname.includes('localhost') ? 'http://' : 'https://';
  const port = req.hostname.includes('localhost') ? `:${process.env.PORT}` : '';

  try {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Feedback</title>
        <link rel="icon" href="/favicon.ico" type="image/x-icon">
        ${liveJs}
      </head>
      <body>
        <h1>Hello World!</h1>

        <p>Put the following code into body tag of the html</p>

        <div style="background-color: #f5f5f5; width: fit-content; border-radius: 5px; padding: 20px;">
          &lt;script src=&quot;${protocol}${req.hostname}${port}/feedback/&lt;slug/&gt;/widget.js&quot;&gt;&lt;/script&gt;
        </div>

        <script src="${protocol}${req.hostname}${port}/feedback/demo/widget.js"></script>
      </body>
    </html>`;

    return res
      .status(200)
      .set({
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      })
      .send(html);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  return res.status(404).send('not found');
});

app.use((error, req, res, next) => {
  let statusCode = 500;

  if (error instanceof NotFoundError) {
    statusCode = error.statusCode;
  }

  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
  }

  if (error instanceof UnauthorizeError) {
    statusCode = error.statusCode;
  }

  return res.status(statusCode).send(error.message);
});

export { app };

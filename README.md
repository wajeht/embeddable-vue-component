# 😀 Embeddable Vue Component
Embeddable widget using Vue components.

# 📕 Code Structure
```
├── /node_modules
├── /dist          # compiled vue code goes here
├── /public        # serving public files from express
├── /server        # express
├── /widget        # vue
├── .env.example
├── .gitignore
├── index.html
└── README.md
```

Vite offers a library compilation mode that allows us to compile a set of Vue components, including assets and CSS, into a single JavaScript file.

We are using Vue to create a custom Web Component and compile it into a single JavaScript bundle.

```html
<feedback-widget slug="test" />
<script type="module" src="/tenant/:slug/widget.umd.js"></script>
```

This can be further extended by writing embeddable JavaScript on the fly, eliminating the need to create multiple separate files.

```javascript
app.get('/feedback/:slug/widget.js', async (req, res, next) => {
  // ...

  const slug = req.params.slug;

  // ...

  if (req.query.embed === 'true') {
    const widget = path.resolve(path.join(process.cwd(), 'dist', 'widget.umd.js'));
    return res
      .status(200)
      .set('Content-Type', 'application/javascript')
      .set('Cache-Control', 'public, max-age=86400') // 24 hours
      .sendFile(widget);
  }

  const javascript = `
    (function() {
      const feedbackWidget = document.createElement('feedback-widget');
      feedbackWidget.setAttribute('slug', "${slug}");
      document.body.appendChild(feedbackWidget);

      const script = document.createElement('script');
      script.src = '/feedback/${slug}/widget.js?embed=true';
      document.body.appendChild(script);
    })();
  `;

  return res
    .set('Content-Type', 'application/javascript')
    .set('Cache-Control', 'public, max-age=86400') // 24 hours
    .send(javascript);
});
```

Now, we can just use a single file as embeddable widget.

```javascript
<script src="/feedback/:slug/widget.js"></script>
```


# 💻 Development

Clone the repository

```bash
$ git clone https://github.com/wajeht/embeddable-vue-component.git
```

Copy `.env.example` to `.env`

```bash
$ cp .env.example .env
```

Install dependencies

```bash
$ npm install
```

Run development server

```bash
$ npm run dev:build:watch
```

Look into `npm` scripts inside `package.json` for more information

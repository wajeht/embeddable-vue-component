import { app } from './app.js';

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`server was stared on http://localhost:${PORT}`);
});

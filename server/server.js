import dotenv from 'dotenv';
import path from 'path';
import { app } from './app.js';

dotenv.config({ path: path.resolve(path.join(process.cwd(), '.env')) });

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`server was stared on http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const CLOUDINARY_CLOUD_NAME = 'da6deau1q';
const CLOUDINARY_API_KEY = '152554215887979';
const CLOUDINARY_API_SECRET = 'QiKt4w1gjldYa9k5PneFXu0YugQ';

app.get('/api/files', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image`,
            {
                auth: {
                    username: CLOUDINARY_API_KEY,
                    password: CLOUDINARY_API_SECRET
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения списка файлов' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
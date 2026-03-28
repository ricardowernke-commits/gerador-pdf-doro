const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.API_KEY || 'minha-chave-super-secreta';
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    next();
});

app.post('/generate-pdf', async (req, res) => {
    const { html, options } = req.body;
    if (!html) return res.status(400).json({ error: 'O campo html é obrigatório.' });

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: 'new'
        });
        
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: options?.format || 'A4',
            landscape: options?.landscape || false,
            printBackground: true,
            margin: options?.margin || { top: 0, bottom: 0, left: 0, right: 0 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Erro na renderização:', error);
        res.status(500).json({ error: 'Erro ao gerar PDF', details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Serviço de PDF rodando na porta ${PORT}`);
});
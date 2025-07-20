// server/utils/pdfProcessor.js
const fs = require('fs');
const pdf = require('pdf-parse');

async function processPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text; // Returns the extracted text content from the PDF
    } catch (error) {
        console.error('Error processing PDF file:', error);
        throw new Error('Failed to extract text from PDF.');
    }
}

module.exports = { processPdf };
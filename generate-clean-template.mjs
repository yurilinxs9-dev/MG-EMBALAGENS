import { PDFDocument, rgb } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";

const WHITE = rgb(1, 1, 1);
const templateBytes = readFileSync("public/Orcamento_MODELO_MG.pdf");
const pdfDoc = await PDFDocument.load(templateBytes);
const page = pdfDoc.getPages()[0];

// Whiteout zona da tabela (apaga 01/02 estáticos)
page.drawRectangle({ x: 40, y: 400, width: 555, height: 210, color: WHITE, borderWidth: 0 });
// "03." sozinho linha TOTAL
page.drawRectangle({ x: 50, y: 375, width: 28, height: 15, color: WHITE, borderWidth: 0 });
// "R$" estático sozinho linha TOTAL
page.drawRectangle({ x: 500, y: 372, width: 22, height: 18, color: WHITE, borderWidth: 0 });
// "CPF /CNPJ: ..." estático
page.drawRectangle({ x: 275, y: 673, width: 170, height: 14, color: WHITE, borderWidth: 0 });

const out = await pdfDoc.save();
writeFileSync("C:/Users/elyam/Downloads/Orcamento_MODELO_MG_LIMPO.pdf", out);
console.log("Gerado: C:/Users/elyam/Downloads/Orcamento_MODELO_MG_LIMPO.pdf");
